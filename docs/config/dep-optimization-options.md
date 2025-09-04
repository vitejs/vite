<!doctype html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>European Elegant Catering — Вітрина</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="logo">
        <h1>European Elegant Catering</h1>
        <p class="tagline">Коли їжа стає мистецтвом ✨</p>
      </div>
      <div class="header-actions">
        <button id="cartBtn" class="cart-btn">Кошик (<span id="cartCount">0</span>)</button>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="intro">
      <p>Мене звати Віта — я фуршетний майстер у Лондоні. Пропоную елегантні та смачні закуски для будь‑яких подій. Виберіть товари нижче та оформіть замовлення.</p>
    </section>

    <section id="products" class="products-grid" aria-label="Каталог товарів">
      <!-- Товари генеруються скриптом -->
    </section>

    <section class="about">
      <h2>Як ми працюємо</h2>
      <p>Швидке приготування, охайна подача, чисті натуральні інгредієнти. Доставка або самовивіз — деталі під час оформлення.</p>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <div>
        <h3>Замовлення та консультація</h3>
        <p class="phone">+44 7366 499132</p>
      </div>
      <div>
        <p>European Elegant Catering — елегантні фуршети та закуски</p>
      </div>
    </div>
  </footer>

  <!-- Кошик (модаль) -->
  <div id="cartModal" class="modal" aria-hidden="true">
    <div class="modal-panel">
      <button class="close-btn" id="closeCart">&times;</button>
      <h2>Ваш кошик</h2>
      <div id="cartItems"></div>

      <div class="cart-summary">
        <strong>Сума: </strong><span id="cartTotal">0.00</span> GBP
      </div>

      <form id="checkoutForm" class="checkout-form">
        <h3>Оформлення замовлення (імітація)</h3>
        <label>Ім'я
          <input type="text" name="name" required />
        </label>
        <label>Телефон
          <input type="tel" name="phone" required />
        </label>
        <label>Адреса / Коментар
          <input type="text" name="address" />
        </label>
        <button type="submit" class="btn primary">Підтвердити замовлення</button>
      </form>

      <button id="clearCart" class="btn">Очистити кошик</button>
    </div>
  </div>

  <div id="overlay" class="overlay" hidden></div>

  <script src="script.js"></script>
</body>
</html>
