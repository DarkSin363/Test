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
    
    fetch('https://a4d9013f-c1c0-46ff-a267-96eefd4d8635-00-351a4rsdvw4x1.spock.replit.dev/create-payment', {
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
    if (!data.payment_url) throw new Error('Не получена ссылка на оплату');
    
    if (Telegram.WebApp.isExpanded) {
        // Для мобильных устройств
        Telegram.WebApp.openLink(data.payment_url);
    } else {
        // Для десктопа
        window.open(data.payment_url, '_blank');
    }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка при создании платежа: ' + error.message);
    });
}

// Отправляем уведомление в Telegram при успешной оплате
function sendTelegramNotification(paymentId) {
    const tg = window.Telegram.WebApp;
    tg.sendData(JSON.stringify({
        type: "payment_success",
        payment_id: paymentId
    }));
    
    // Альтернатива: показать всплывающее уведомление
    tg.showAlert(`Платеж ${paymentId} успешно завершен!`);
}

// Проверяем, был ли платеж успешным при загрузке страницы
Telegram.WebApp.ready();
Telegram.WebApp.onEvent('viewportChanged', () => {
    const startParam = Telegram.WebApp.initDataUnsafe?.start_param;
    if (startParam?.includes('payment_success')) {
        const paymentId = startParam.split('_')[2];
        completePurchase(paymentId); // Ваша функция обновления счетчика
    }
});

// Возврат товара
function refundLastPurchase() {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    if (purchases.length === 0) {
        alert("Нет покупок для возврата!");
        return;
    }
    
    // Запрос к Go-серверу на возврат
    fetch('https://ваш-go-сервер.ру/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: purchases[purchases.length - 1].id })
    })
    .then(() => {
        purchases.pop();
        localStorage.setItem('purchases', JSON.stringify(purchases));
        alert("Возврат оформлен!");
        document.getElementById('purchase-count').textContent = 
            `Вы купили ${purchases.length} кроссовок`;
    });
}

function logToServer(message) {
    fetch('https://9f54ba3afab066072a449066a2468de3.serveo.net/create-payment', {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

logToServer("Button clicked");
