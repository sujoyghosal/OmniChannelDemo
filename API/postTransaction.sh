curl --location 'http://localhost:8080/transaction' \
--header 'Content-Type: application/json' \
--data-raw '{
    "user_name": "Sujoy Ghosal",
    "user_email": "sujoy.ghosal@gmail.com",
    "user_phone": 9876543210,
    "merchant_name": "KFC",
    "merchant_email": "kfc@terminal21pattaya.com",
    "merchant_phone": 887654433221,
    "merchant_address": "KFC, Terminal 21 Mall, 4th Floor, Pattaya",
    "transaction_amount": 1805.73,
    "transaction_currency": "TBH"
}'
