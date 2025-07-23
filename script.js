document.addEventListener('DOMContentLoaded', function() {
    if (window.Telegram && Telegram.WebApp) {
        // Отправляем данные пользователя на сервер
        sendUserData();
    }
});

function sendUserData() {
    if (!window.Telegram || !Telegram.WebApp) {
        console.error('Telegram WebApp not initialized');
        return;
    }
    
    const initData = Telegram.WebApp.initData;
    if (!initData) {
        console.error('No initData available');
        return;
    }
    
    console.log('Sending initData:', initData);
    
    fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/user-init', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Telegram-InitData': initData
        },
        body: JSON.stringify({ initData })
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Server response:', data);
    })
    .catch(error => {
        console.error('Request failed:', error);
    });
}

// Перенаправление на страницу покупок
function viewPurchases() {
    window.location.href = "purchases.html";
}

// Возврат на главную
function goBack() {
    window.location.href = "index.html";
}

// Покупка через ЮKassa
function buySneakers() {
    if (!window.Telegram || !Telegram.WebApp) {
        alert('Telegram WebApp не инициализирован');
        return;
    }
    
    fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            amount: 2000, 
            description: "Мюли 'Инжир'" 
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        if (!data.payment_url) {
            throw new Error('Не получена ссылка на оплату');
        }

        const paymentInfo = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            amount: 2000,
            status: 'pending'
        };
        
        const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
        purchases.push(paymentInfo);
        localStorage.setItem('purchases', JSON.stringify(purchases));
        
        // Используем стандартное открытие ссылки
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.openLink(data.payment_url);
        } else {
            window.open(data.payment_url, '_blank');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка при создании платежа: ' + error.message);
    });
}

// Возврат последнего платежа
async function refundLastPurchase() {
    try {
        if (!confirm("Вы уверены, что хотите вернуть последнюю покупку?")) {
            return;
        }

        // Отправляем пустой объект {}, так как сервер сам находит последний платеж
        const response = await fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}) // Отправляем пустой объект
        });

        if (!response.ok) {
            const errorText = await response.text();
            if (errorText.includes("No successful payments") || 
                errorText.includes("no_successful_payments")) {
                throw new Error("У вас нет успешных покупок для возврата");
            }
            throw new Error(errorText || "Ошибка сервера");
        }

        const result = await response.json();
        
        // Обновляем локальное хранилище
        const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
        if (purchases.length > 0) {
            purchases[purchases.length - 1].status = "refunded";
            localStorage.setItem('purchases', JSON.stringify(purchases));
        }
        
        alert(result.message || "Возврат успешно выполнен!");
        updatePurchaseCount();
    } catch (error) {
        console.error("Ошибка возврата:", error);
        alert(error.message.includes("У вас нет успешных покупок") 
            ? error.message 
            : "Ошибка при возврате: " + error.message);
    }
}

// Вспомогательная функция для получения ID последнего платежа
function getLastSuccessfulPaymentId() {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    for (let i = purchases.length - 1; i >= 0; i--) {
        if (purchases[i].status === "succeeded") {
            return purchases[i].id;
        }
    }
    throw new Error("Не найдено успешных платежей");
}
function updatePurchaseCount() {
    fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/get-purchase-count')
        .then(response => response.json())
        .then(data => {
            if (document.getElementById('purchase-count')) {
                document.getElementById('purchase-count').textContent = 
                    `Количество покупок: ${data.count}`;
            }
        })
        .catch(console.error);
}

async function updatePurchaseCount() {
    const isOnline = await checkConnection();
    if (!isOnline) {
        const lastCount = localStorage.getItem('lastPurchaseCount') || 0;
        document.getElementById('purchase-count').textContent = 
            `Количество покупок: ${lastCount} (оффлайн режим)`;
        return;
    }
    try {
        const response = await fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/get-purchase-count');
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Сервер вернул ошибку: ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data || typeof data.count === 'undefined') {
            throw new Error("Неверный формат ответа от сервера");
        }
        
        if (document.getElementById('purchase-count')) {
            document.getElementById('purchase-count').textContent = 
                `Количество покупок: ${data.count}`;
            localStorage.setItem('lastPurchaseCount', data.count);
        }
    } catch (error) {
        console.error('Error updating purchase count:', error);
        
        // Пробуем получить данные из localStorage
        const lastCount = localStorage.getItem('lastPurchaseCount');
        if (document.getElementById('purchase-count')) {
            if (lastCount) {
                document.getElementById('purchase-count').textContent = 
                    `Количество покупок: ${lastCount} (данные могут быть устаревшими)`;
            } else {
                document.getElementById('purchase-count').textContent = 
                    'Не удалось загрузить данные. Ошибка: ' + error.message;
            }
        }
    }
}
function checkConnection() {
    return new Promise((resolve) => {
        if (navigator.onLine) {
            resolve(true);
        } else {
            // Дополнительная проверка через HEAD запрос
            fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev', {
                method: 'HEAD',
                cache: 'no-cache'
            })
            .then(() => resolve(true))
            .catch(() => resolve(false));
        }
    });
}
function logToServer(message) {
    fetch('http://localhost:8080/log', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

logToServer("Button clicked");
