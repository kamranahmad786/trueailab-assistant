document.addEventListener('DOMContentLoaded', () => {
    const chatDisplay = document.getElementById('chat-display');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const loadingTemplate = document.getElementById('loading-template');
    
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const exportChatBtn = document.getElementById('export-chat-btn');
    const attachmentBtn = document.getElementById('attachment-btn');
    const fileUpload = document.getElementById('file-upload');
    const toastContainer = document.getElementById('toast-container');
    
    const menuCurrentChat = document.getElementById('menu-current-chat');
    const menuSettings = document.getElementById('menu-settings');
    const recentChatList = document.getElementById('recent-chat-list');
    const chatTitleHeader = document.getElementById('chat-title-header');

    // Default welcome message HTML
    const welcomeHtml = `
        <div class="message assistant-message" id="welcome-msg">
            <div class="message-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>
            <div class="message-wrapper">
                <div class="message-content">
                    Hello! I am your TRUEAILAB Assistant. You can ask me questions about your documentation and I will use Retrieval-Augmented Generation to find the answers. How can I help you today?
                </div>
            </div>
        </div>
    `;

    // --- Session & History Management ---
    let sessionId = localStorage.getItem('currentSessionId');
    let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    function generateSessionId() {
        return Math.random().toString(36).substring(2, 15);
    }

    function initSession() {
        if (!sessionId) {
            sessionId = generateSessionId();
            localStorage.setItem('currentSessionId', sessionId);
        }
        
        let currentSession = sessions.find(s => s.id === sessionId);
        if (!currentSession) {
            currentSession = { id: sessionId, title: 'New Conversation', timestamp: Date.now(), messages: [] };
            sessions.unshift(currentSession);
            saveSessions();
        }
        
        loadSessionToUI(currentSession);
        renderRecentChats();
    }

    function saveSessions() {
        // Keep only top 20 recent sessions
        sessions = sessions.slice(0, 20);
        localStorage.setItem('sessions', JSON.stringify(sessions));
        renderRecentChats();
    }

    function saveMessageToCurrentSession(text, isUser, meta = null) {
        let currentSession = sessions.find(s => s.id === sessionId);
        if (currentSession) {
            // Auto-generate title from first user message
            if (currentSession.messages.length === 0 && isUser) {
                currentSession.title = text.length > 25 ? text.substring(0, 25) + '...' : text;
                chatTitleHeader.textContent = currentSession.title;
            }
            
            currentSession.messages.push({
                text: text,
                isUser: isUser,
                meta: meta
            });
            currentSession.timestamp = Date.now();
            
            // Sort sessions so most recent is at top
            sessions.sort((a, b) => b.timestamp - a.timestamp);
            saveSessions();
        }
    }

    function loadSessionToUI(session) {
        chatDisplay.innerHTML = '';
        chatTitleHeader.textContent = session.messages.length > 0 ? session.title : 'Knowledge Base Assistant';
        
        if (session.messages.length === 0) {
            chatDisplay.innerHTML = welcomeHtml;
        } else {
            session.messages.forEach(msg => {
                renderMessageHTML(msg.text, msg.isUser, msg.meta);
            });
            scrollToBottom();
        }
        
        // Highlight active session in sidebar
        document.querySelectorAll('.menu-item-recent').forEach(el => {
            el.classList.toggle('active', el.dataset.id === sessionId);
        });
    }

    function switchSession(newSessionId) {
        sessionId = newSessionId;
        localStorage.setItem('currentSessionId', sessionId);
        const session = sessions.find(s => s.id === sessionId);
        loadSessionToUI(session);
    }

    function resetConversation() {
        sessionId = generateSessionId();
        localStorage.setItem('currentSessionId', sessionId);
        let newSession = { id: sessionId, title: 'New Conversation', timestamp: Date.now(), messages: [] };
        sessions.unshift(newSession);
        saveSessions();
        loadSessionToUI(newSession);
    }

    function renderRecentChats() {
        recentChatList.innerHTML = '';
        sessions.forEach(session => {
            if (session.messages.length === 0 && session.id !== sessionId) return; // Don't show empty inactive sessions
            
            const div = document.createElement('div');
            div.className = `menu-item menu-item-recent ${session.id === sessionId ? 'active' : ''}`;
            div.dataset.id = session.id;
            div.innerHTML = `
                <i class="fa-regular fa-message"></i>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${session.title}</span>
            `;
            div.addEventListener('click', () => {
                switchSession(session.id);
            });
            recentChatList.appendChild(div);
        });
    }

    // --- UI Helper Functions ---
    
    function showToast(message, icon = 'fa-info-circle') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function renderMessageHTML(message, isUser = false, meta = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
        
        let metaHtml = '';
        if (meta && !isUser) {
            metaHtml = `
                <div class="meta-info">
                    <span class="meta-tag"><i class="fa-solid fa-layer-group"></i> ${meta.retrievedChunks} Chunks</span>
                    <span class="meta-tag"><i class="fa-solid fa-bolt"></i> ${meta.tokensUsed} Tokens</span>
                </div>
            `;
        }

        const avatarIcon = isUser ? 'fa-user' : 'fa-robot';

        msgDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid ${avatarIcon}"></i>
            </div>
            <div class="message-wrapper">
                <div class="message-content">${message.replace(/\\n/g, '<br>')}</div>
                ${metaHtml}
            </div>
        `;
        
        chatDisplay.appendChild(msgDiv);
    }

    function addMessageToUI(message, isUser = false, meta = null) {
        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) welcomeMsg.remove();
        
        renderMessageHTML(message, isUser, meta);
        saveMessageToCurrentSession(message, isUser, meta);
        scrollToBottom();
    }

    function showLoading() {
        const clone = loadingTemplate.content.cloneNode(true);
        chatDisplay.appendChild(clone);
        scrollToBottom();
    }

    function hideLoading() {
        const loadingMsg = document.querySelector('.loading-msg');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }

    function scrollToBottom() {
        chatDisplay.scrollTo({
            top: chatDisplay.scrollHeight,
            behavior: 'smooth'
        });
    }

    // --- Interactive Button Event Listeners ---
    
    newChatBtn.addEventListener('click', () => {
        resetConversation();
        showToast('Started a new conversation', 'fa-check');
    });

    clearChatBtn.addEventListener('click', () => {
        // Delete current session from history
        sessions = sessions.filter(s => s.id !== sessionId);
        saveSessions();
        resetConversation();
        showToast('Chat history deleted', 'fa-trash-can');
    });

    exportChatBtn.addEventListener('click', () => {
        const currentSession = sessions.find(s => s.id === sessionId);
        if (!currentSession || currentSession.messages.length === 0) {
            showToast('No conversation to export', 'fa-triangle-exclamation');
            return;
        }
        
        const textContent = currentSession.messages.map(m => 
            `${m.isUser ? 'You' : 'Assistant'}: ${m.text}`
        ).join('\\n\\n');

        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat_export_${currentSession.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Chat exported successfully', 'fa-download');
    });

    attachmentBtn.addEventListener('click', () => {
        fileUpload.click();
    });

    fileUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const fileName = e.target.files[0].name;
            showToast(`File "${fileName}" attached (Simulated)`, 'fa-paperclip');
            messageInput.value = `[Attached: ${fileName}] ` + messageInput.value;
            fileUpload.value = ''; 
        }
    });

    menuSettings.addEventListener('click', () => {
        showToast('Settings are not implemented in this demo.', 'fa-lock');
    });

    menuCurrentChat.addEventListener('click', () => {
        scrollToBottom();
    });

    // --- Submit Handling ---

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (!message) return;

        addMessageToUI(message, true);
        messageInput.value = '';
        messageInput.disabled = true;
        sendBtn.disabled = true;
        
        showLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    message: message
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.detail || 'Failed to communicate with the server');
            }

            const data = await response.json();
            
            hideLoading();
            
            addMessageToUI(data.reply, false, {
                tokensUsed: data.tokensUsed,
                retrievedChunks: data.retrievedChunks
            });

        } catch (error) {
            hideLoading();
            addMessageToUI(`Error: ${error.message}`, false);
        } finally {
            messageInput.disabled = false;
            sendBtn.disabled = false;
            messageInput.focus();
            scrollToBottom();
        }
    });

    // Initialize the app on load
    initSession();
});
