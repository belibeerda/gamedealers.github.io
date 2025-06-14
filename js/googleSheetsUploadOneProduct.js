document.addEventListener('DOMContentLoaded', function() {
    // Скрываем скелетон после загрузки
    const preloader = document.getElementById('preloader');
    updateCartCount();

    // Получаем ID товара из URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        window.location.href = 'index.html'; // Перенаправляем если нет ID
        return;
    }

    // Загружаем данные товара
    async function loadProductData() {
        try {
            // Запрос к Google Sheets API
            const url = `https://sheets.googleapis.com/v4/spreadsheets/1DqloAEOGkDMqudEEB3rSFgWVTvnIuyJtu9uJERqo4Wg/values/productsList?key=AIzaSyAdHF7Odd1Zn4aXpK9Z2bV6SUoFD3Iceh0`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Преобразуем данные в массив объектов
            const [headers, ...rows] = data.values;
            const products = rows.map(row => {
                const product = {};
                headers.forEach((header, index) => {
                    product[header.toLowerCase()] = row[index];
                });
                return product;
            });
            
            // Находим товар по ID
            const product = products.find(p => p.id === productId);
            
            if (!product) {
                throw new Error('Товар не найден');
            }
            
            // Заполняем данные на странице
            populateProductData(product);

            // Скрываем скелетон после успешной загрузки
            preloader.style.display = 'none';
            
        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
            showErrorMessage();

            // Скрываем скелетон при ошибке
            preloader.style.display = 'none';
        }
    }

    // Заполнение данных товара
    function populateProductData(product) {
        // Основная информация
        document.getElementById('product-title').textContent = product.name;
        document.getElementById('product-description').textContent = product.description;
        
        // Цена и скидка
        const priceElement = document.querySelector('.new-price');
        const oldPriceElement = document.querySelector('.old-price');
        const discountElement = document.querySelector('.discount');
        
        priceElement.textContent = `${product.price} ₽`;
        
        if (product.action && product.action.trim() !== '') {
            const discount = parseFloat(product.action);
            const oldPrice = parseFloat(product.price);
            const newPrice = Math.round(oldPrice * (1 - discount / 100));
            
            oldPriceElement.textContent = `${product.price} ₽`;
            discountElement.textContent = `-${discount}%`;
            priceElement.textContent = `${newPrice} ₽`;
        } else {
            document.querySelector('.old-price-container').style.display = 'none';
        }
        
        // Жанры
        if (product.genres && product.genres.trim() !== '') {
            const genresContainer = document.getElementById('product-genres');
            const genresTitle = document.getElementsByClassName('genresTitle')[0];
            genresTitle.textContent = "Жанры:";
            
            // Разделяем теги по запятой и убираем лишние пробелы
            const genres = product.genres.split(',')
                            .map(genre => genre.trim())
                            .filter(genre => genre.length > 0);
            
            // Создаем элементы для каждого тега
            genres.forEach(genre => {

                const genreWrapper = document.createElement('div');
                genreWrapper.className = 'genre'; // Добавляем класс для стилизации

                // Создаем ссылку
                const genreElement = document.createElement('a');
                genreElement.className = 'genre-link';
                genreElement.textContent = genre;
                genreElement.href = "#"; // Устанавливаем href

                // Добавляем ссылку внутрь div-обертки
                genreWrapper.appendChild(genreElement);

                // Добавляем div-обертку в контейнер жанров
                genresContainer.appendChild(genreWrapper);
            });
        }

        //Платформы
        if (product.platforms && product.platforms.trim() !== '') {
            const platformsContainer = document.getElementById('product-platforms');
            const platformsTitle = document.getElementsByClassName('platformsTitle')[0];
            platformsTitle.textContent = "Выберите платформу:";

            const platforms = product.platforms.split(',')
                .map(platform => platform.trim())
                .filter(platform => platform.length > 0);

            platforms.forEach((platform, index) => {
                const label = document.createElement('label');
                label.className = 'product-platforms-radio';

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = 'platform';
                radio.value = platform;
                if (index === 0) radio.checked = true;

                const span = document.createElement('span');
                span.textContent = platform;

                label.appendChild(radio);
                label.appendChild(span);
                platformsContainer.appendChild(label);
            });
        }


        if (product.screenshots && product.screenshots.trim() !== '') {
            const screenshots = product.screenshots
                                    .split(',')
                                    .map(url => url.trim())
                                    .filter(url => url.length > 0)
                                    .map(url => `../images/screenshots/${url}`);
            
            const thumbnailsContainer = document.getElementById('screenshots-thumbnails');
            const mainImage = document.getElementById('main-screenshot');
            
            // Загружаем первое изображение
            if (screenshots.length > 0) {
                mainImage.src = screenshots[0];
                mainImage.alt = `Скриншот 1 из ${screenshots.length}`;
            }
            
            // Создаём миниатюры
            screenshots.forEach((url, index) => {
                const thumb = document.createElement('img');
                thumb.src = url;
                thumb.alt = `Скриншот ${index + 1}`;
                thumb.classList.add('thumbnail');
                
                thumb.addEventListener('click', () => {
                    mainImage.src = url;
                    mainImage.alt = `Скриншот ${index + 1} из ${screenshots.length}`;
                    
                    // Обновляем активную миниатюру
                    document.querySelectorAll('.thumbnail').forEach(t => {
                        t.classList.remove('active');
                    });
                    thumb.classList.add('active');
                });
                
                if (index === 0) thumb.classList.add('active');
                thumbnailsContainer.appendChild(thumb);
            });
            
            // Навигация
            let currentIndex = 0;
            document.querySelector('.gallery-next').addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % screenshots.length;
                updateMainImage(screenshots[currentIndex], currentIndex);
            });
            
            document.querySelector('.gallery-prev').addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + screenshots.length) % screenshots.length;
                updateMainImage(screenshots[currentIndex], currentIndex);
            });
            
            function updateMainImage(url, index) {
                mainImage.src = url;
                mainImage.alt = `Скриншот ${index + 1} из ${screenshots.length}`;
                
                document.querySelectorAll('.thumbnail').forEach((t, i) => {
                    t.classList.toggle('active', i === index);
                });
            }
        }

        // Кнопка "Купить"
        const priceContainer = document.querySelector('.price-container');

        // Создаем кнопку
        const button = document.createElement('button');
        button.textContent = 'Купить'; // Текст на кнопке
        button.className = 'buy-button'; // Добавляем класс

        // Добавляем атрибут data-product-id
        button.setAttribute('data-product-id', `${product.id}`);

        priceContainer.appendChild(button);

        document.querySelector('.buy-button').addEventListener('click', function() {
            addToCart(productId, product);
        });
    }

    // Показ сообщения об ошибке
    function showErrorMessage() {
        document.querySelector('main').innerHTML = `
            <div class="error-message">
                <div class="error-message-text">
                    <h2>Товар не найден</h2>
                    <p>Извините, запрашиваемый товар не существует или был удален.</p>
                    <a href="search.html">Вернуться в каталог</a>
                </div>
            </div>
        `;
    }

    // Запускаем загрузку данных
    loadProductData();
});

// Функция добавления в корзину
function addToCart(productId, product) {
    // let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // const existingItem = cart.find(item => item.id === productId);
    
    // if (existingItem) {
    //     existingItem.quantity += 1;
    // } else {
    //     cart.push({
    //         id: productId,
    //         name: product.name,
    //         price: Math.round(parseFloat(product.price) * (1 - product.action / 100)),
    //         image: `../images/${product.image}`,
    //         quantity: 1
    //     });
    // }
    
    // localStorage.setItem('cart', JSON.stringify(cart));
    // showCartNotification();
    // updateCartCount();
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const selectedPlatformInput = document.querySelector('input[name="platform"]:checked');
    const selectedPlatform = selectedPlatformInput ? selectedPlatformInput.value : 'Без платформы';

    const discount = parseFloat(product.action) || 0;
    const basePrice = parseFloat(product.price);
    const finalPrice = basePrice - (basePrice * discount / 100);

    const existingItem = cart.find(item => item.id === productId && item.platform === selectedPlatform);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: finalPrice,
            image: `../images/${product.image}`,
            platform: selectedPlatform,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    showCartNotification();
    updateCartCount();
}

// Показ уведомления
function showCartNotification() {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.textContent = 'Товар добавлен в корзину!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

function updateCartCount () {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCountElement = document.getElementById('cart-count');

    if (!cartCountElement) return; // Если элемент не найден — выходим

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartCountElement.textContent = totalItems;
        cartCountElement.style.display = 'inline-block';
    } else {
        cartCountElement.style.display = 'none';
    }
}