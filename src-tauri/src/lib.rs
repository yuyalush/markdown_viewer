use notify::{EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter};

/// ウィンドウラベルをキーとするウォッチャマップ（ウィンドウごとに独立した監視を行う）
struct WatcherState(Mutex<HashMap<String, RecommendedWatcher>>);

/// ファイルを読み込んでテキストを返す
#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

/// CLI 起動引数の最初のファイルパスを返す
#[tauri::command]
fn get_cli_open_path() -> Option<String> {
    std::env::args()
        .nth(1)
        .filter(|a| !a.starts_with('-'))
}

/// ファイルを監視して変更時に "file-changed" イベントを emit する
/// Windows では単一保存でも複数イベントが発火するため 300ms デバウンスを設ける
#[tauri::command]
fn watch_file(
    path: String,
    window_label: String,
    app: AppHandle,
    state: tauri::State<'_, WatcherState>,
) -> Result<(), String> {
    let app_handle = app.clone();
    let watch_path = path.clone();
    // デバウンス用の最終 emit 時刻（初期値は十分に過去の時刻）
    let last_emit = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(1)));

    let mut watcher =
        notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
            if let Ok(event) = res {
                match event.kind {
                    EventKind::Modify(_) | EventKind::Create(_) => {
                        let mut last = last_emit.lock().unwrap();
                        let now = Instant::now();
                        // 300ms 以内の重複イベントは無視する
                        if now.duration_since(*last) < Duration::from_millis(300) {
                            return;
                        }
                        *last = now;
                        let _ = app_handle.emit("file-changed", &watch_path);
                    }
                    _ => {}
                }
            }
        })
        .map_err(|e| e.to_string())?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    // ウィンドウラベルをキーとして登録（旧ウォッチャは drop で自動解除）
    state.0.lock().unwrap().insert(window_label, watcher);

    Ok(())
}

/// 指定ディレクトリ内の .md / .markdown ファイル一覧をフルパスで返す
#[tauri::command]
fn list_md_files(dir: String) -> Result<Vec<String>, String> {
    let mut files: Vec<String> = std::fs::read_dir(&dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().map(|t| t.is_file()).unwrap_or(false))
        .filter(|e| {
            let name = e.file_name().to_string_lossy().to_lowercase();
            name.ends_with(".md") || name.ends_with(".markdown")
        })
        .map(|e| e.path().to_string_lossy().into_owned())
        .collect();
    files.sort();
    Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(WatcherState(Mutex::new(HashMap::new())))
        .invoke_handler(tauri::generate_handler![
            read_file,
            get_cli_open_path,
            watch_file,
            list_md_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
