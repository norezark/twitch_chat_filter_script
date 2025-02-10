// ==UserScript==
// @name         twitch_chat_filter_script
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  filter chat lines without badges on Twitch chat
// @author       norezark
// @include      https://www.twitch.tv/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // セレクタ定義: チャットコンテナ、チャット行、バッジ、ヘッダーのDOM要素を指定
    const parentSelector = '.chat-shell, .video-chat';
    const chatSelector = 'div.Layout-sc-1xcs6mc-0:has(div.chat-line__message), .InjectLayout-sc-1i43xsx-0:has(div.vod-message)';
    const badgeSelector = 'button[data-a-target="chat-badge"], img.chat-badge';
    const headerSelector = '.chat-shell > div > div > div:first-child';

    // バッジが存在しない場合、チャット行の表示を切り替える関数
    const switchLineVisibilityIfNoBadge = (chatElement, invisible) => {
        // バッジがない場合のみ表示状態を変更
        if (!chatElement.querySelector(badgeSelector)) {
            chatElement.style.display = invisible ? 'none' : 'unset';
        }
    };

    // UI作成処理: チェックボックス付きフィルターUIを追加し、全チャット行に対するフィルタ適用関数を返す
    const createFilterUI = (headerElement, parentElement) => {
        const div = document.createElement("div");
        div.style.marginLeft = "10px";
        div.innerHTML = `
        <label for="toggle-visible">
            <input type="checkbox" id="toggle-visible" style="vertical-align: middle;" />
            <a>Enabled Filter</a>
        </label>`;
        const checkbox = div.querySelector("input");
        checkbox.defaultChecked = true;
        headerElement.appendChild(div);

        const applyVisibilityToAll = () => {
            parentElement.querySelectorAll(chatSelector).forEach((node) => {
                switchLineVisibilityIfNoBadge(node, checkbox.checked);
            });
        };
        checkbox.addEventListener("change", applyVisibilityToAll);
        return { checkbox, applyVisibilityToAll };
    };

    // MutationObserverの設定: 新規追加されたチャット行にフィルタ処理を適用
    const setupObserver = (parentElement, checkbox) => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (!(node instanceof Element)) return;
                        if (node.matches(chatSelector)) {
                            switchLineVisibilityIfNoBadge(node, checkbox.checked);
                        }
                    });
                }
            });
        });
        observer.observe(parentElement, { childList: true, subtree: true });
    };

    // チャットフィルタ機能の初期化処理
    const initChatFilter = () => {
        // 親要素(チャットコンテナ)を取得。存在しなければ再試行
        const parentElement = document.querySelector(parentSelector);
        if (!parentElement) {
            return setTimeout(initChatFilter, 1000);
        }
        // 子要素のレンダリング待ちのための遅延処理
        setTimeout(() => {
            const headerElement = document.querySelector(headerSelector);
            if (!headerElement) return; // ヘッダーが取得できなければ中断
            const { checkbox, applyVisibilityToAll } = createFilterUI(headerElement, parentElement);
            setupObserver(parentElement, checkbox);
            // 初期ロード時のチャット行フィルタリング
            applyVisibilityToAll();
        }, 1000);
    };

    // ページ読み込み後、1秒遅延してフィルタ初期化処理を開始
    setTimeout(initChatFilter, 1000);
})();
