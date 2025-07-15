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

// Возврат товара
function refundLastPurchase() {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    if (purchases.length === 0) {
        alert("Нет покупок для возврата!");
        return;
    }
    
    // Запрос к серверу на возврат
    fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: purchases[purchases.length - 1].id })
    })
    .then(() => {
        purchases.pop();
        localStorage.setItem('purchases', JSON.stringify(purchases));
        alert("Возврат оформлен!");
        updatePurchaseCount(); // Обновляем счетчик
    });
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

function logToServer(message) {
    fetch('http://localhost:8080/log', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

logToServer("Button clicked");
