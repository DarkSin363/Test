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
    // Здесь будет запрос к вашему Go-серверу для создания платежа
    fetch('https://ваш-go-сервер.ру/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 2000, description: "Кроссовки Nike Air Max" })
    })
    .then(response => response.json())
    .then(data => {
        // Открываем платежную форму ЮKassa
        Telegram.WebApp.openInvoice(data.payment_url);
    });
}

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
