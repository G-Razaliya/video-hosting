"use strict";
// ============ DOM ELEMENTS ============
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const videosList = document.getElementById('videosList');
const uploadForm = document.getElementById('uploadForm');
const videoTitle = document.getElementById('videoTitle');
const videoFile = document.getElementById('videoFile');
// ============ GLOBAL VARIABLES ============
let currentVideos = [];
// ============ START VIDEO ============
function startVideo(videoId) {
    const video = document.getElementById(`video-${videoId}`);
    const container = document.querySelector(`.video-container[data-video-id="${videoId}"]`);
    if (!video || !container)
        return;
    // Останавливаем все другие видео
    document.querySelectorAll('video').forEach(otherVideo => {
        if (otherVideo.id !== `video-${videoId}`) {
            otherVideo.pause();
            const otherId = otherVideo.id.replace('video-', '');
            const otherContainer = document.querySelector(`.video-container[data-video-id="${otherId}"]`);
            if (otherContainer) {
                otherContainer.classList.remove('playing');
            }
        }
    });
    // Запускаем текущее видео
    video.play();
    container.classList.add('playing');
    video.controls = true; // Показываем стандартный проигрыватель
}
// ============ SETUP VIDEO CLICK ============
function setupVideoClick() {
    // Клик по оверлею Play
    document.querySelectorAll('.play-overlay').forEach(overlay => {
        overlay.removeEventListener('click', (e) => { });
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = overlay.closest('.video-container');
            const videoId = container?.dataset.videoId;
            if (videoId) {
                startVideo(videoId);
            }
        });
    });
    // Клик по контейнеру (на само видео)
    document.querySelectorAll('.video-container').forEach(container => {
        container.removeEventListener('click', (e) => { });
        container.addEventListener('click', (e) => {
            // Если кликнули не по оверлею
            if (!e.target.classList.contains('play-overlay')) {
                const videoId = container.dataset.videoId;
                if (videoId) {
                    startVideo(videoId);
                }
            }
        });
    });
}
// ============ SETUP VIDEO EVENTS ============
function setupVideoEvents() {
    document.querySelectorAll('video').forEach(video => {
        video.removeEventListener('ended', () => { });
        video.removeEventListener('pause', () => { });
        video.removeEventListener('play', () => { });
        video.addEventListener('ended', () => {
            const videoId = video.id.replace('video-', '');
            const container = document.querySelector(`.video-container[data-video-id="${videoId}"]`);
            if (container) {
                container.classList.remove('playing');
            }
            video.controls = false;
        });
        video.addEventListener('pause', () => {
            const videoId = video.id.replace('video-', '');
            const container = document.querySelector(`.video-container[data-video-id="${videoId}"]`);
            if (container && !video.ended) {
                container.classList.remove('playing');
            }
        });
        video.addEventListener('play', () => {
            const videoId = video.id.replace('video-', '');
            const container = document.querySelector(`.video-container[data-video-id="${videoId}"]`);
            if (container) {
                container.classList.add('playing');
            }
            video.controls = true;
        });
    });
}
// ============ LOAD VIDEOS ============
async function loadVideos() {
    if (!searchInput || !sortSelect)
        return;
    const search = searchInput.value;
    const sort = sortSelect.value;
    try {
        const response = await fetch(`../backend/videos.php?search=${encodeURIComponent(search)}&sort=${sort}`);
        const videos = await response.json();
        currentVideos = videos;
        renderVideos(videos);
        setupVideoClick();
        setupVideoEvents();
    }
    catch (error) {
        console.error('Ошибка загрузки видео:', error);
    }
}
// ============ RENDER VIDEOS ============
function renderVideos(videos) {
    if (!videosList)
        return;
    if (videos.length === 0) {
        videosList.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">🎬 Видео не найдены</p>';
        return;
    }
    videosList.innerHTML = videos.map(video => {
        const likedClass = video.user_liked ? 'liked' : '';
        const heartIcon = video.user_liked ? '❤️' : '♡';
        return `
            <div class="video-card" data-id="${video.id}">
                <div class="video-container" data-video-id="${video.id}">
                    <video id="video-${video.id}" preload="metadata" playsinline>
                        <source src="../backend/videos/${video.filename}" type="video/mp4">
                        Ваш браузер не поддерживает видео
                    </video>
                    <div class="play-overlay">▶</div>
                </div>
                <div class="video-info">
                    <div class="video-title">${escapeHtml(video.title)}</div>
                    <div class="video-stats">
                        <div class="likes">
                            <button class="like-btn ${likedClass}" onclick="likeVideo(${video.id}, this)">
                                ${heartIcon}
                            </button>
                            <span class="like-count">${video.likes}</span>
                        </div>
                        <div class="date">${formatDate(video.uploaded_at)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
// ============ LIKE VIDEO ============
async function likeVideo(videoId, button) {
    try {
        const response = await fetch('../backend/like.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: videoId })
        });
        const result = await response.json();
        if (result.success && result.likes !== undefined) {
            const likeCount = button.parentElement?.querySelector('.like-count');
            if (likeCount) {
                likeCount.textContent = result.likes.toString();
            }
            if (result.action === 'liked') {
                button.classList.add('liked');
                button.textContent = '❤️';
            }
            else if (result.action === 'unliked') {
                button.classList.remove('liked');
                button.textContent = '♡';
            }
            const video = currentVideos.find(v => v.id === videoId);
            if (video) {
                video.likes = result.likes;
                video.user_liked = (result.action === 'liked');
            }
        }
    }
    catch (error) {
        console.error('Ошибка при лайке:', error);
    }
}
// ============ UPLOAD VIDEO ============
if (uploadForm && videoTitle && videoFile) {
    uploadForm.addEventListener('submit', async (e) => {
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
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.querySelector('.progress-fill');
        if (progressBar)
            progressBar.style.display = 'block';
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '../backend/upload.php');
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && progressFill) {
                    const percent = (e.loaded / e.total) * 100;
                    progressFill.style.width = percent + '%';
                }
            });
            xhr.onload = () => {
                if (progressBar)
                    progressBar.style.display = 'none';
                if (progressFill)
                    progressFill.style.width = '0%';
                const result = JSON.parse(xhr.responseText);
                if (result.success) {
                    showMessage('uploadMessage', result.message || 'Загружено!', 'success');
                    videoTitle.value = '';
                    videoFile.value = '';
                    loadVideos();
                }
                else {
                    showMessage('uploadMessage', result.message || 'Ошибка', 'error');
                }
            };
            xhr.onerror = () => {
                if (progressBar)
                    progressBar.style.display = 'none';
                showMessage('uploadMessage', 'Ошибка загрузки', 'error');
            };
            xhr.send(formData);
        }
        catch (error) {
            if (progressBar)
                progressBar.style.display = 'none';
            showMessage('uploadMessage', 'Ошибка: ' + error, 'error');
        }
    });
}
// ============ SEARCH AND SORT ============
let searchTimeout;
if (searchInput && sortSelect && videosList) {
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(loadVideos, 500);
    });
    sortSelect.addEventListener('change', loadVideos);
    loadVideos();
}
// ============ HELPER FUNCTIONS ============
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}
function showMessage(elementId, message, type) {
    const msgDiv = document.getElementById(elementId);
    if (!msgDiv)
        return;
    msgDiv.textContent = message;
    msgDiv.className = `message ${type}`;
    setTimeout(() => {
        msgDiv.className = 'message';
        msgDiv.textContent = '';
    }, 3000);
}
function logout() {
    window.location.href = 'index.html';
}
// ============ GLOBAL FUNCTIONS FOR HTML ============
window.likeVideo = likeVideo;
window.logout = logout;
