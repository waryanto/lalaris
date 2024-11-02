(function() {
    // Daftar blog yang diizinkan untuk menggunakan template ini
    const allowedBlogs = ["lalarisfoodx.blogspot.com", "fooddelivery.blogspot.com", "makanenak.blogspot.com"];

    // Mendapatkan hostname dari URL blog saat ini
    const currentBlog = window.location.hostname;

    // Mengecek apakah blog saat ini ada dalam daftar yang diizinkan
    if (!allowedBlogs.includes(currentBlog)) {
        // Jika tidak memiliki lisensi, hapus seluruh konten halaman
        document.documentElement.innerHTML = ""; // Kosongkan seluruh halaman

        // Alternatif: Arahkan ke halaman pemberitahuan lisensi
        window.location.href = "https://lalaris.com";
    }
})();

// Koordinat resto
const restoLat = -7.701550;
const restoLng = 110.368524;

// Tarif ongkos kirim
const minimalTarif = 9000;
const tarifPerKm = 2500;

// Fungsi pencarian produk
function searchProducts() {
    const query = document.getElementById("search-input").value.trim().toLowerCase();
    loadProducts(query);
}

document.getElementById("search-button").addEventListener("click", searchProducts);
document.getElementById("search-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        searchProducts();
    }
});

// Inisialisasi keranjang
let cart = [];

// Fungsi untuk memuat produk
function loadProducts(query = "") {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = ""; 

    fetch('/feeds/posts/default?alt=json')
        .then(response => response.json())
        .then(data => {
            const posts = data.feed.entry;
            const categorizedProducts = {};

            posts.forEach(post => {
                const content = post.content.$t;
                const titleMatch = content.match(/<h2>(.*?)<\/h2>/);
                const title = titleMatch ? titleMatch[1] : 'Produk Tanpa Nama';

                if (query && !title.toLowerCase().includes(query.toLowerCase())) {
                    return;
                }

                const imgMatch = content.match(/<img.*?src="(.*?)"/);
                const imgSrc = imgMatch ? imgMatch[1] : 'https://via.placeholder.com/100';

                const priceMatch = content.match(/Harga\/Rp\.?\d+/i);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/[^\d]/g, '')) : 0;

                const labels = post.category ? post.category.map(cat => cat.term) : ['Uncategorized'];

                const variationMatch = content.match(/<ul class="variations">(.*?)<\/ul>/s);
                const variations = variationMatch ? variationMatch[1].match(/<li>(.*?)<\/li>/g).map(v => {
                    const [variationName, variationPrice] = v.replace(/<\/?li>/g, '').split(' - Rp');
                    return { name: variationName.trim(), price: parseInt(variationPrice) };
                }) : [];

                const toppingMatch = content.match(/<ul class="toppings">(.*?)<\/ul>/s);
                const toppings = toppingMatch ? toppingMatch[1].match(/<li>(.*?)<\/li>/g).map(t => {
                    const [toppingName, toppingPrice] = t.replace(/<\/?li>/g, '').split(' - Rp');
                    return { name: toppingName.trim(), price: toppingPrice ? parseInt(toppingPrice) : 0 };
                }) : [];

                const product = {
                    title,
                    imgSrc,
                    price,
                    variations,
                    toppings
                };

                labels.forEach(label => {
                    if (!categorizedProducts[label]) {
                        categorizedProducts[label] = [];
                    }
                    categorizedProducts[label].push(product);
                });
            });

            for (const [category, products] of Object.entries(categorizedProducts)) {
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category;
                menuContainer.appendChild(categoryTitle);

                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'category-container';

                products.forEach(product => {
                    const menuItem = document.createElement('div');
                    menuItem.className = 'menu-item d-flex justify-content-between mb-4 align-items-start';
                    menuItem.innerHTML = `
                        <div class='menu-details'>
                            <h5 class='mb-1'>${product.title}</h5>
                            <span class='text-success mb-2 d-block'>Rp${product.price}</span>
                            <div class='description mb-2'>Deskripsi Produk Tersedia</div>
                        </div>
                        <div class='image-section d-flex flex-column align-items-center'>
                            <img alt='${product.title}' class='img-thumbnail mb-2' src='${product.imgSrc}' style='width: 100px; height: 100px; object-fit: cover;'/>
                            <button class='btn btn-primary buy-btn' data-price='${product.price}' data-title='${product.title}' data-toppings='${JSON.stringify(product.toppings)}' data-variations='${JSON.stringify(product.variations)}'>Beli</button>
                        </div>
                    `;
                    categoryContainer.appendChild(menuItem);
                });

                menuContainer.appendChild(categoryContainer);
            }

            document.querySelectorAll('.buy-btn').forEach(button => {
                button.onclick = (event) => {
                    const productName = button.getAttribute('data-title');
                    const productPrice = parseInt(button.getAttribute('data-price'));
                    const variations = JSON.parse(button.getAttribute('data-variations'));
                    const toppings = JSON.parse(button.getAttribute('data-toppings'));

                    if (variations.length > 0) {
                        showVariationModal(productName, variations, toppings);
                    } else {
                        addToCart(productName, productPrice, event, toppings);
                    }
                };
            });
        });
}

// Fungsi untuk menambahkan produk ke keranjang
function addToCart(name, price, event) {
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    const flyingItem = document.createElement('div');
    flyingItem.classList.add('flying-item');
    flyingItem.textContent = '+1';
    document.body.appendChild(flyingItem);

    const rect = event.target.getBoundingClientRect();
    flyingItem.style.position = 'absolute';
    flyingItem.style.left = `${rect.left + window.scrollX}px`;
    flyingItem.style.top = `${rect.top + window.scrollY}px`;

    const cartRect = document.getElementById('cart').getBoundingClientRect();
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2;

    requestAnimationFrame(() => {
        flyingItem.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px)`;
        flyingItem.style.transition = 'transform 0.7s ease, opacity 0.7s ease';
        flyingItem.style.opacity = 0;
    });

    flyingItem.addEventListener('transitionend', () => {
        flyingItem.remove();
    });

    document.getElementById('cart-count').textContent = cart.length;
    updateCartPopup();
}

// Fungsi untuk checkout dan mengirim pesanan ke WhatsApp
function checkout() {
    if (cart.length === 0) {
        alert('Keranjang belanja kosong!');
        return;
    }

    document.getElementById('cart-popup').style.display = 'none';
    const customerFormContainer = document.getElementById('customer-form-container');
    customerFormContainer.style.display = 'flex';

    customerFormContainer.scrollIntoView({ behavior: 'smooth' });
    showOrderSummary();
    initMap();
}

// Fungsi untuk mengirim pesanan ke WhatsApp
function submitOrder() {
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const shippingCost = document.getElementById('shipping-cost').value;
    const totalPayment = document.getElementById('total-payment').value;

    if (!name || !address || !latitude || !longitude) {
        alert('Mohon lengkapi data pelanggan!');
        return;
    }

    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    let orderDetails = 'Pesanan Anda:\n';
    cart.forEach((item, index) => {
        orderDetails += `${index + 1}. ${item.name} - Rp${item.price} x ${item.quantity}\n`;
    });

    const message = `
Halo, saya ingin melakukan pemesanan dengan rincian sebagai berikut:

Nama: ${name}
Alamat: ${address}
Link Lokasi: ${googleMapsLink}

${orderDetails}
Ongkos Kirim: ${shippingCost}
Total Pembayaran: ${totalPayment}

Terima kasih!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappNumber = '62895343019273';
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    window.open(whatsappURL, '_blank');
}

window.onload = function() {
    loadProducts();
    document.getElementById('customer-form-container').style.display = 'none';
};
