document.addEventListener('DOMContentLoaded', () => {
    let paymentHistory = [];

    function updateOrderTotals() {
        fetch('/api/orders')
            .then(response => response.json())
            .then(orders => {
                const orderTotals = {};
                orders.forEach(order => {
                    const tableNumber = order.tableNumber;
                    if (!orderTotals[tableNumber]) {
                        orderTotals[tableNumber] = { total: 0, tip: 0 };
                    }
                    const orderTotal = order.items.reduce((sum, item) => sum + item.price, 0);
                    const tipAmount = order.tip || 0;
                    orderTotals[tableNumber].total += orderTotal;
                    orderTotals[tableNumber].tip += tipAmount;
                });

                const activeOrdersTableBody = document.querySelector('#activeOrdersTable tbody');
                activeOrdersTableBody.innerHTML = ''; // Clear previous totals

                for (const tableNumber in orderTotals) {
                    if (!isOrderInHistory(tableNumber)) {
                        const row = activeOrdersTableBody.insertRow();
                        const tableCell = row.insertCell();
                        const totalCell = row.insertCell();
                        const actionsCell = row.insertCell();

                        tableCell.textContent = tableNumber;
                        totalCell.innerHTML = `₹${orderTotals[tableNumber].total.toFixed(2)} (including tip ₹${orderTotals[tableNumber].tip.toFixed(2)})`;

                        const button = document.createElement('button');
                        button.textContent = 'Amount Received';
                        button.addEventListener('click', () => handleAmountReceived(tableNumber, orderTotals[tableNumber].total, orderTotals[tableNumber].tip));
                        actionsCell.appendChild(button);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching orders:', error);
            });
    }

    function handleAmountReceived(tableNumber, totalAmount, tipAmount) {
        const paymentMethod = prompt("Enter payment method (Cash/Online):");
        if (paymentMethod) {
            const paymentData = { tableNumber, totalAmount, tipAmount, paymentMethod, date: new Date().toLocaleString() };
            paymentHistory.push(paymentData);
            updatePaymentHistory();
            removeOrderFromActive(tableNumber);

            // Send payment data to the backend
            fetch('/api/save_payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData),
            })
            .then(response => response.json())
            .then(data => {
                console.log('Payment data saved:', data);
            })
            .catch(error => {
                console.error('Error saving payment data:', error);
            });
        }
    }

    function updatePaymentHistory() {
        const paymentHistoryList = document.getElementById('paymentHistory');
        paymentHistoryList.innerHTML = '';
        paymentHistory.forEach(payment => {
            const li = document.createElement('li');
            li.textContent = `Table ${payment.tableNumber}: ₹${payment.totalAmount.toFixed(2)} (including tip ₹${payment.tipAmount.toFixed(2)}) - ${payment.paymentMethod} on ${payment.date}`;
            const printButton = document.createElement('button');
            printButton.textContent = 'Print';
            printButton.addEventListener('click', () => printOrder(payment.tableNumber));
            li.appendChild(printButton);
            paymentHistoryList.appendChild(li);
        });
    }

    function removeOrderFromActive(tableNumber) {
        const activeOrdersTableBody = document.querySelector('#activeOrdersTable tbody');
        for (let row of activeOrdersTableBody.rows) {
            if (row.cells[0].textContent == tableNumber) {
                row.remove();
                break;
            }
        }
    }

    function isOrderInHistory(tableNumber) {
        return paymentHistory.some(payment => payment.tableNumber === tableNumber);
    }

    function loadPaymentHistory() {
        fetch('/api/payment_history')
            .then(response => response.json())
            .then(data => {
                paymentHistory = data;
                updatePaymentHistory();
            })
            .catch(error => {
                console.error('Error loading payment history:', error);
            });
    }

    function printOrder(tableNumber) {
        fetch(`/api/order_details?table=${tableNumber}`)
            .then(response => response.json())
            .then(orderDetails => {
                let printWindow = window.open('', '', 'height=600,width=800');
                printWindow.document.write('<html><head><title>Order Details</title>');
                printWindow.document.write('</head><body>');
                printWindow.document.write('<h1>Order Details for Table ' + tableNumber + '</h1>');
                printWindow.document.write('<ul>');
                orderDetails.items.forEach(item => {
                    printWindow.document.write('<li>' + item.name + ' - ₹' + item.price + '</li>');
                });
                printWindow.document.write('</ul>');
                printWindow.document.write('<p>Total: ₹' + orderDetails.total + '</p>');
                if (orderDetails.tip) {
                    printWindow.document.write('<p>Tip: ₹' + orderDetails.tip + '</p>');
                }
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            })
            .catch(error => {
                console.error('Error fetching order details:', error);
            });
    }

    // Initialize the payment history and order totals on page load
    loadPaymentHistory();
    updateOrderTotals();
    setInterval(updateOrderTotals, 5000); // Update every 5 seconds
});
