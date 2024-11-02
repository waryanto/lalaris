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
      
      
      // Fungsi pencarian
function searchProducts() {
    const query = document.getElementById("search-input").value.trim().toLowerCase();
    loadProducts(query); // Panggil loadProducts dengan kata kunci
}

document.getElementById("search-button").addEventListener("click", searchProducts);
document.getElementById("search-input").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        searchProducts();
    }
});


      
	
      
        // Inisialisasi keranjang
let cart = [];

function loadProducts(query = "") {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = ""; // Bersihkan kontainer sebelum menampilkan hasil baru

    fetch('/feeds/posts/default?alt=json')
        .then(response => response.json())
        .then(data => {
            const posts = data.feed.entry;
            const categorizedProducts = {};

            posts.forEach(post => {
                const content = post.content.$t;

                // Parsing nama produk
                const titleMatch = content.match(/<h2>(.*?)<\/h2>/);
                const title = titleMatch ? titleMatch[1] : 'Produk Tanpa Nama';
      
      			// Jika ada kata kunci pencarian, pastikan produk sesuai dengan kata kunci
                if (query && !title.toLowerCase().includes(query.toLowerCase())) {
                    return; // Lewati produk yang tidak cocok dengan kata kunci
                }

                // Parsing URL gambar produk
                const imgMatch = content.match(/<img.*?src="(.*?)"/);
                const imgSrc = imgMatch ? imgMatch[1] : 'https://via.placeholder.com/100';

                // Parsing harga produk
                const priceMatch = content.match(/Harga\/Rp\.?\d+/i);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/[^\d]/g, '')) : 0;

                // Parsing label/kategori
                const labels = post.category ? post.category.map(cat => cat.term) : ['Uncategorized'];

                // Parsing variasi produk
                const variationMatch = content.match(/<ul class="variations">(.*?)<\/ul>/s);
                const variations = variationMatch ? variationMatch[1].match(/<li>(.*?)<\/li>/g).map(v => {
                    const [variationName, variationPrice] = v.replace(/<\/?li>/g, '').split(' - Rp');
                    return { name: variationName.trim(), price: parseInt(variationPrice) };
                }) : [];

                // Parsing topping produk
                const toppingMatch = content.match(/<ul class="toppings">(.*?)<\/ul>/s);
                const toppings = toppingMatch ? toppingMatch[1].match(/<li>(.*?)<\/li>/g).map(t => {
                    const [toppingName, toppingPrice] = t.replace(/<\/?li>/g, '').split(' - Rp');
                    return { name: toppingName.trim(), price: toppingPrice ? parseInt(toppingPrice) : 0 };
                }) : [];

                // Membuat objek produk
                const product = {
                    title,
                    imgSrc,
                    price,
                    variations,
                    toppings
                };

                // Mengelompokkan produk berdasarkan label/kategori
                labels.forEach(label => {
                    if (!categorizedProducts[label]) {
                        categorizedProducts[label] = [];
                    }
                    categorizedProducts[label].push(product);
                });
            });

            // Tampilkan produk berdasarkan kategori di halaman
            for (const [category, products] of Object.entries(categorizedProducts)) {
                // Membuat elemen judul kategori
                const categoryTitle = document.createElement('h3');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category;
                menuContainer.appendChild(categoryTitle);

                // Membuat kontainer produk untuk kategori
                const categoryContainer = document.createElement('div');
                categoryContainer.className = 'category-container';

                products.forEach(product => {
                    // Membuat elemen item menu
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

            // Event listener untuk tombol "Beli"
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



      function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';

    // Menghilangkan elemen toast setelah beberapa detik
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000); // Toast akan muncul selama 3 detik
}

      	
      
// Fungsi modal variasi dan topping
function showVariationModal(productName, variations, toppings) {
    selectedProduct = { name: productName, variations, toppings };

    const modal = document.getElementById('variation-modal');
    const titleElem = document.getElementById('modal-product-title');
    const variationSelect = document.getElementById('product-variation');

    titleElem.textContent = `Pilih variasi untuk ${productName}`;
    variationSelect.innerHTML = '';

    variations.forEach(variation => {
        const option = document.createElement('option');
        option.value = JSON.stringify(variation);
        option.textContent = `${variation.name} - Rp${variation.price}`;
        variationSelect.appendChild(option);
    });

    // Menambahkan topping
    const toppingContainer = document.getElementById('topping-options');
    toppingContainer.innerHTML = ''; // Bersihkan topping lama
    toppings.forEach(topping => {
        const toppingElem = document.createElement('label');
        toppingElem.className = 'd-block';
        toppingElem.innerHTML = `<input data-price='${topping.price}' type='checkbox' value='${topping.name}'/> ${topping.name} ${topping.price > 0 ? `- Rp${topping.price}` : ''}`;
        toppingContainer.appendChild(toppingElem);
    });

    modal.style.display = 'flex';
}



// Menutup modal variasi produk
function closeVariationModal() {
    document.getElementById('variation-modal').style.display = 'none';
}


// Menambahkan produk dengan variasi dan topping ke keranjang
function addVariationToCart() {
    const selectedOption = document.getElementById('product-variation').value;
    const selectedVariation = JSON.parse(selectedOption);

    // Ambil topping yang dipilih dan hitung total harga topping
    const selectedToppings = Array.from(document.querySelectorAll('#topping-options input:checked')).map(t => {
        return { name: t.value, price: parseInt(t.getAttribute('data-price')) || 0 };
    });
    const totalToppingPrice = selectedToppings.reduce((total, topping) => total + topping.price, 0);

    // Tambahkan ke keranjang dengan nama dan harga total (variasi + topping)
    const productName = `${selectedProduct.name} - ${selectedVariation.name} (Topping: ${selectedToppings.map(t => t.name).join(', ')})`;
    const productPrice = selectedVariation.price + totalToppingPrice;

    addToCart(productName, productPrice, { target: document.querySelector('.cart') });
    closeVariationModal();
}





        // Fungsi untuk menampilkan atau menyembunyikan popup keranjang
function toggleCartPopup() {
    const cartPopup = document.getElementById('cart-popup');
    cartPopup.style.display = (cartPopup.style.display === 'block') ? 'none' : 'block';
}
      
      // Menambahkan event listener untuk klik pada keranjang
document.getElementById('cart').addEventListener('click', function() {
    toggleCartPopup();
});

        function updateCartPopup() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Keranjang masih kosong.</p>';
    } else {
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>Rp${item.price * item.quantity}</span>
                <button class='remove-btn' onclick='removeItem(${index})'>
                    <i class='fas fa-trash-alt'></i>
                </button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    }
}


      // Fungsi untuk menambahkan produk ke keranjang dengan animasi
function addToCart(name, price, event) {
    // Cek apakah produk sudah ada di keranjang berdasarkan nama produk
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        // Jika produk sudah ada, tambahkan jumlahnya
        existingItem.quantity += 1;
    } else {
        // Jika produk belum ada, tambahkan produk baru ke dalam keranjang
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    // Animasi terbang ke keranjang
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

    // Update jumlah item di keranjang dan tampilkan pesan sukses
    document.getElementById('cart-count').textContent = cart.length;
    showToast(`${name} berhasil ditambahkan ke keranjang!`);
    
    // Update popup keranjang
    updateCartPopup();
}


function removeFromCart(name) {
    // Temukan indeks item berdasarkan nama
    const itemIndex = cart.findIndex(item => item.name === name);

    // Jika item ditemukan, hapus dari keranjang
    if (itemIndex !== -1) {
        cart.splice(itemIndex, 1);
        updateCartPopup();
        updateCartCount();
        showToast(`${name} berhasil dihapus dari keranjang!`);
    }
}



function updateCartCount() {
    // Hitung total item berdasarkan kuantitas masing-masing item dalam keranjang
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalCount;
    
    // Perbarui tampilan popup keranjang untuk menunjukkan perubahan
    updateCartPopup();
}





// Menutup popup jika mengklik di luar area popup
window.addEventListener('click', function(event) {
    const cartPopup = document.getElementById('cart-popup');
    const cartButton = document.getElementById('cart');
    
    if (!cartPopup.contains(event.target) && event.target !== cartButton) {
        cartPopup.style.display = 'none';
    }
});

function removeItem(index) {
    // Hapus item dari keranjang berdasarkan index
    cart.splice(index, 1);

    // Update tampilan popup keranjang dan jumlah item di ikon keranjang
    updateCartPopup();
    updateCartCount();
}



        // Panggil fungsi ini ketika tombol checkout diklik
function checkout() {
    if (cart.length === 0) {
        alert('Keranjang belanja kosong!');
        return;
    }

    // Sembunyikan popup keranjang dan tampilkan form pelanggan
    document.getElementById('cart-popup').style.display = 'none';
    const customerFormContainer = document.getElementById('customer-form-container');
    customerFormContainer.style.display = 'flex'; // Tampilkan form

    // Auto-scroll langsung ke form data pelanggan
customerFormContainer.scrollIntoView({ behavior: 'smooth' });


    // Tampilkan detail pesanan dan peta
    showOrderSummary();
    initMap(); // Inisialisasi peta
}
      
      // Fungsi untuk membatalkan checkout dan kembali ke tampilan keranjang
    function cancelCheckout() {
        document.getElementById('customer-form-container').style.display = 'none';
        document.getElementById('cart-popup').style.display = 'block';
    }
      
      // Fungsi untuk menghitung ongkos kirim
    function calculateShippingCost(distance) {
        const cost = minimalTarif + (tarifPerKm * distance);
        return cost < minimalTarif ? minimalTarif : Math.round(cost);
    }
      
       // Fungsi untuk memperbarui total pembayaran
    function updateTotalPayment(shippingCost) {
        // Hitung total harga pesanan
        const orderTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        document.getElementById('order-total').textContent = `Rp${orderTotal}`;

        // Hitung total pembayaran
        const totalPayment = orderTotal + shippingCost;
        document.getElementById('total-payment').value = `Rp${totalPayment}`;
    }
      
      // Fungsi untuk menampilkan detail pesanan dan total harga
    function showOrderSummary() {
        const orderItemsContainer = document.getElementById('order-items');
        const orderTotalElement = document.getElementById('order-total');
        orderItemsContainer.innerHTML = '';

        let totalAmount = 0;
        cart.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            listItem.innerHTML = `
                ${item.name} (x${item.quantity})
                <span>Rp${item.price * item.quantity}</span>
            `;
            orderItemsContainer.appendChild(listItem);
            totalAmount += item.price * item.quantity;
        });

        orderTotalElement.textContent = `Rp${totalAmount}`;
    }
      
      
       function submitOrder() {
    // Ambil data pelanggan dari form
    const name = document.getElementById('name').value;
    const address = document.getElementById('address').value;
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const shippingCost = document.getElementById('shipping-cost').value;
    const totalPayment = document.getElementById('total-payment').value;

    // Periksa apakah data pelanggan sudah lengkap
    if (!name || !address || !latitude || !longitude) {
        alert('Mohon lengkapi data pelanggan!');
        return;
    }

    // Buat link lokasi Google Maps
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Buat rincian pesan pesanan
    let orderDetails = 'Pesanan Anda:\n';
    cart.forEach((item, index) => {
        orderDetails += `${index + 1}. ${item.name} - Rp${item.price} x ${item.quantity}\n`;
    });

    // Buat pesan WhatsApp
    const message = `
Halo, saya ingin melakukan pemesanan dengan rincian sebagai berikut:

Nama: ${name}
Alamat: ${address}
Link Lokasi: ${googleMapsLink}

${orderDetails}
Ongkos Kirim: ${shippingCost}
Total Pembayaran: ${totalPayment}

Terima kasih!`;

    // Encode pesan untuk URL
    const encodedMessage = encodeURIComponent(message);

    // Nomor WhatsApp tujuan (ganti dengan nomor WhatsApp Anda)
    const whatsappNumber = '62895343019273'; // Nomor WhatsApp dalam format internasional

    // URL WhatsApp
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Arahkan ke WhatsApp
    window.open(whatsappURL, '_blank');
}

      
       // Fungsi untuk inisialisasi peta Leaflet
    function initMap() {
        const map = L.map('map').setView([restoLat, restoLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&#169; OpenStreetMap'
        }).addTo(map);

        // Tambahkan marker untuk resto
        L.marker([restoLat, restoLng]).addTo(map).bindPopup("Resto").openPopup();

        // Cek Geolocation pengguna
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Tambahkan marker pengguna
                const userMarker = L.marker([userLat, userLng], { draggable: true }).addTo(map)
                    .bindPopup("Lokasi Anda").openPopup();
                map.setView([userLat, userLng], 15);

                // Tampilkan koordinat
                document.getElementById('latitude').value = userLat;
                document.getElementById('longitude').value = userLng;

                // Hitung ongkos kirim
                const distance = map.distance([userLat, userLng], [restoLat, restoLng]) / 1000;
                const shippingCost = calculateShippingCost(distance);
                document.getElementById('shipping-cost').value = `Rp${shippingCost}`;

                // Hitung total pembayaran
                updateTotalPayment(shippingCost);

                // Event saat marker dipindahkan
                userMarker.on('move', function(e) {
                    const newLat = e.latlng.lat.toFixed(6);
                    const newLng = e.latlng.lng.toFixed(6);
                    document.getElementById('latitude').value = newLat;
                    document.getElementById('longitude').value = newLng;

                    const newDistance = map.distance([newLat, newLng], [restoLat, restoLng]) / 1000;
                    const newShippingCost = calculateShippingCost(newDistance);
                    document.getElementById('shipping-cost').value = `Rp${newShippingCost}`;
                    updateTotalPayment(newShippingCost);
                });
            }, () => {
                alert('Gagal mendeteksi lokasi, silakan isi alamat secara manual.');
            });
        } else {
            alert('Geolocation tidak didukung oleh browser ini.');
        }
    }

        // Panggil fungsi untuk load produk saat halaman dimuat
window.onload = function() {
    loadProducts();
    document.getElementById('customer-form-container').style.display = 'none';
}
