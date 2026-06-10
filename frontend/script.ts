// ============ TYPES ============
interface Video {
    id: number;
    title: string;
    filename: string;
    likes: number;
    uploaded_at: string;
}

interface ApiResponse {
    success: boolean;
    message?: string;
    likes?: number;
}

// ============ GLOBAL VARIABLES ============
let currentVideos: Video[] = [];

// ============ DOM ELEMENTS ============
const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
const sortSelect = document.getElementById('sortSelect') as HTMLSelectElement | null;
const videosList = document.getElementById('videosList') as HTMLElement | null;
const uploadForm = document.getElementById('uploadForm') as HTMLFormElement | null;
const videoTitle = document.getElementById('videoTitle') as HTMLInputElement | null;
const videoFile = document.getElementById('videoFile') as HTMLInputElement | null;

// ============ FUNCTIONS ============
async function loadVideos(): Promise<void> {
    if (!searchInput || !sortSelect) return;
    
    const search = searchInput.value;
    const sort = sortSelect.value;
    
    try {
        const response = await fetch(`../backend/videos.php?search=${encodeURIComponent(search)}&sort=${sort}`);
        const videos: Video[] = await response.json();
        currentVideos = videos;
        renderVideos(videos);
    } catch (error) {
        console.error('Ошибка загрузки видео:', error);
    }
}

function renderVideos(videos: Video[]): void {
    if (!videosList) return;
    
    if (videos.length === 0) {
        videosList.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">🎬 Видео не найдены</p>';
        return;
    }

    videosList.innerHTML = videos.map(video => `
        <div class="video-card" data-id="${video.id}">
            <div class="video-container">
                <video controls preload="metadata">
                    <source src="../backend/videos/${video.filename}" type="video/mp4">
                    Ваш браузер не поддерживает видео
                </video>
            </div>
            <div class="video-info">
                <div class="video-title">${escapeHtml(video.title)}</div>
                <div class="video-stats">
                    <div class="likes">
                        <button class="like-btn" onclick="likeVideo(${video.id}, this)">❤️</button>
                        <span class="like-count">${video.likes}</span>
                    </div>
                    <div class="date">${formatDate(video.uploaded_at)}</div>
                </div>
            </div>
        </div>
    `).join('');
}

async function likeVideo(videoId: number, button: HTMLElement): Promise<void> {
    try {
        const response = await fetch('../backend/like.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId })
        });
        const result: ApiResponse = await response.json();
        
        if (result.success && result.likes !== undefined) {
            const likeCount = button.parentElement?.querySelector('.like-count') as HTMLElement;
            if (likeCount) {
                likeCount.textContent = result.likes.toString();
            }
            
            const video = currentVideos.find(v => v.id === videoId);
            if (video) video.likes = result.likes;
        }
    } catch (error) {
        console.error('Ошибка при лайке:', error);
    }
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function showMessage(elementId: string, message: string, type: 'success' | 'error'): void {
    const msgDiv = document.getElementById(elementId);
    if (!msgDiv) return;
    
    msgDiv.textContent = message;
    msgDiv.className = `message ${type}`;
    
    setTimeout(() => {
        msgDiv.className = 'message';
        msgDiv.textContent = '';
    }, 3000);
}

function logout(): void {
    window.location.href = 'index.html';
}

// ============ EVENT LISTENERS ============
if (uploadForm && videoTitle && videoFile) {
    uploadForm.addEventListener('submit', async (e: Event) => {
        e.preventDefault();
        
        const title = videoTitle.value;
        const file = videoFile.files?.[0];
        
        if (!title || !file) {
            showMessage('uploadMessage', 'Заполните все поля', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('video', file);

        const progressBar = document.querySelector('.progress-bar') as HTMLElement;
        const progressFill = document.querySelector('.progress-fill') as HTMLElement;
        
        if (progressBar) progressBar.style.display = 'block';

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '../backend/upload.php');
            
            xhr.upload.addEventListener('progress', (e: ProgressEvent) => {
                if (e.lengthComputable && progressFill) {
                    const percent = (e.loaded / e.total) * 100;
                    progressFill.style.width = percent + '%';
                }
            });
            
            xhr.onload = () => {
                if (progressBar) progressBar.style.display = 'none';
                if (progressFill) progressFill.style.width = '0%';
                
                const result: ApiResponse = JSON.parse(xhr.responseText);
                if (result.success) {
                    showMessage('uploadMessage', result.message || 'Загружено!', 'success');
                    videoTitle.value = '';
                    videoFile.value = '';
                    loadVideos();
                } else {
                    showMessage('uploadMessage', result.message || 'Ошибка', 'error');
                }
            };
            
            xhr.onerror = () => {
                if (progressBar) progressBar.style.display = 'none';
                showMessage('uploadMessage', 'Ошибка загрузки', 'error');
            };
            
            xhr.send(formData);
        } catch (error) {
            if (progressBar) progressBar.style.display = 'none';
            showMessage('uploadMessage', 'Ошибка: ' + error, 'error');
        }
    });
}

// Поиск и сортировка
let searchTimeout: number;
if (searchInput && sortSelect && videosList) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadVideos, 500);
    });
    sortSelect.addEventListener('change', loadVideos);
    
    // Загружаем видео при загрузке страницы
    loadVideos();
}

// Делаем функции глобальными для HTML onclick
(window as any).likeVideo = likeVideo;
(window as any).logout = logout;