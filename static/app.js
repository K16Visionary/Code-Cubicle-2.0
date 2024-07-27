document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableNumber = urlParams.get('table');
    document.getElementById('tableNumber').textContent = tableNumber;

    const soupMenu = document.getElementById('soup-menu');
    const startersMenu = document.getElementById('starters-menu');
    const riceNoodlesMenu = document.getElementById('rice-noodles-menu');
    const mainCourseMenu = document.getElementById('main-course-menu');
    const tandoorMenu = document.getElementById('tandoor-menu');
    const soyaChaapMenu = document.getElementById('soya-chaap-menu');
    const orderList = document.getElementById('order');
    const totalPriceElement = document.getElementById('totalPrice');
    const tipAmountElement = document.getElementById('tipAmount');
    const notification = document.getElementById('notification');
    const ordersList = document.getElementById('orders');

    let currentOrder = [];
    let totalPrice = 0;
    let ordersVisible = false;

    fetch('/api/menu')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.name}</span><span>₹${item.price.toFixed(2)}</span>`;

                const noteInput = document.createElement('input');
                noteInput.type = 'text';
                noteInput.placeholder = 'Add a note';

                const button = document.createElement('button');
                button.textContent = 'Add to Order';
                button.dataset.item = JSON.stringify(item);
                button.addEventListener('click', () => addToOrder(item, noteInput.value));

                li.appendChild(noteInput);
                li.appendChild(button);

                switch (item.category) {
                    case "SOUPS":
                        soupMenu.appendChild(li);
                        break;
                    case "STARTERS (DRY/GRAVY)":
                        startersMenu.appendChild(li);
                        break;
                    case "RICE & NOODLES":
                        riceNoodlesMenu.appendChild(li);
                        break;
                    case "MAIN COURSE":
                        mainCourseMenu.appendChild(li);
                        break;
                    case "TANDOOR APPETIZERS":
                        tandoorMenu.appendChild(li);
                        break;
                    case "AMMAS SOYA CHAAP SPECIALITY":
                        soyaChaapMenu.appendChild(li);
                        break;
                }
            });
        });

    function addToOrder(item, note) {
        const itemData = { ...item, note };
        currentOrder.push(itemData);

        const orderItem = document.createElement('li');
        orderItem.innerHTML = `${itemData.name} - ₹${itemData.price.toFixed(2)} - Note: ${itemData.note}`;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-btn');
        removeButton.addEventListener('click', () => removeItemFromOrder(itemData, orderItem));

        orderItem.appendChild(removeButton);
        orderList.appendChild(orderItem);

        totalPrice += itemData.price;
        totalPriceElement.textContent = totalPrice.toFixed(2);

        showNotification('Added Successfully');
    }

    function removeItemFromOrder(item, orderItemElement) {
        const index = currentOrder.findIndex(orderItem => orderItem.name === item.name && orderItem.note === item.note);
        if (index > -1) {
            currentOrder.splice(index, 1);
            orderList.removeChild(orderItemElement);
            totalPrice -= item.price;
            totalPriceElement.textContent = totalPrice.toFixed(2);

            showNotification('Removed Successfully');
        }
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    document.getElementById('placeOrder').addEventListener('click', () => {
        if (currentOrder.length === 0) return alert("Order is empty!");

        const tipAmount = parseFloat(tipAmountElement.value) || 0;
        
        fetch('/api/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: currentOrder,
                tableNumber: tableNumber,
                tip: tipAmount
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            currentOrder = [];
            orderList.innerHTML = '';
            totalPrice = 0;
            totalPriceElement.textContent = '0.00';
            tipAmountElement.value = '';
        });
    });

    document.getElementById('showOrders').addEventListener('click', () => {
        if (ordersVisible) {
            ordersList.innerHTML = ''; 
            ordersVisible = false;
        } else {
            fetch(`/api/orders?table=${tableNumber}`)
            .then(response => response.json())
            .then(orders => {
                ordersList.innerHTML = ''; 
                orders.forEach(order => {
                    const li = document.createElement('li');
                    li.textContent = `Table ${order.tableNumber}: ${order.items.map(item => item.name + ' (Note: ' + item.note + ')').join(', ')}`;
                    ordersList.appendChild(li);
                });
                ordersVisible = true;
            });
        }
    });
});
