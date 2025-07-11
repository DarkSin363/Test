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
    
    // Показываем индикатор загрузки
    Telegram.WebApp.MainButton.showProgress(true);
    
    fetch('https://201aab02-66e6-41f8-bd94-e0671776d62f-00-1vg00qvesbdwi.janeway.replit.dev/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            amount: 2000, 
            description: "Мюли 'Инжир'",
            user_id: Telegram.WebApp.initDataUnsafe.user.id // Передаем ID пользователя
        })
    })
    .then(response => response.json())
    .then(data => {
        Telegram.WebApp.openInvoice(data.payment_url, (status) => {
            Telegram.WebApp.MainButton.hideProgress();
            if (status === 'paid') {
                handlePaymentSuccess({
                    payment_id: data.payment_id,
                    amount: data.amount,
                    currency: data.currency
                });
            }
        });
    })
    .catch(error => {
        Telegram.WebApp.MainButton.hideProgress();
        Telegram.WebApp.showAlert("Ошибка: " + error.message);
    });
}

Telegram.WebApp.ready();
updatePurchaseCounter();

function handlePaymentSuccess(paymentData) {
    const tg = window.Telegram.WebApp;
    
    // 1. Показываем всплывающее уведомление
    tg.showAlert(`✅ Оплата ${paymentData.payment_id} на ${paymentData.amount} ${paymentData.currency} прошла успешно!`);
    
    // 2. Обновляем счетчик покупок
    const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    purchases.push({
        id: paymentData.payment_id,
        amount: paymentData.amount,
        date: new Date().toISOString()
    });
    localStorage.setItem('purchases', JSON.stringify(purchases));
    
    // 3. Обновляем UI
    updatePurchaseCounter();
    
    // 4. Можно отправить данные в бота
    tg.sendData(JSON.stringify({
        type: "payment_success",
        payment_id: paymentData.payment_id,
        amount: paymentData.amount
    }));
}

// Обновление счетчика на странице
function updatePurchaseCounter() {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    const counterElement = document.getElementById('purchase-count');
    if (counterElement) {
        counterElement.textContent = `Куплено товаров: ${purchases.length}`;
    }
}

// Возврат товара
function refundLastPurchase() {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || [];
    if (purchases.length === 0) {
        alert("Нет покупок для возврата!");
        return;
    }
    
    // Запрос к Go-серверу на возврат
    fetch('https://a4d9013f-c1c0-46ff-a267-96eefd4d8635-00-351a4rsdvw4x1.spock.replit.dev/refund', {
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
