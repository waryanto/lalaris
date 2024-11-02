 (function() {
            // Daftar blog yang diizinkan untuk menggunakan template ini
            const allowedBlogs = [&quot;lalarisfoodx.blogspot.com&quot;, &quot;fooddelivery.blogspot.com&quot;, &quot;makanenak.blogspot.com&quot;];

            // Mendapatkan hostname dari URL blog saat ini
            const currentBlog = window.location.hostname;

            // Mengecek apakah blog saat ini ada dalam daftar yang diizinkan
            if (!allowedBlogs.includes(currentBlog)) {
                // Jika tidak memiliki lisensi, hapus seluruh konten halaman
                document.documentElement.innerHTML = &quot;&quot;; // Kosongkan seluruh halaman

                // Alternatif: Arahkan ke halaman pemberitahuan lisensi
                window.location.href = &quot;https://lalaris.com&quot;;
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
    const query = document.getElementById(&quot;search-input&quot;).value.trim().toLowerCase();
    loadProducts(query); // Panggil loadProducts dengan kata kunci
}

document.getElementById(&quot;search-button&quot;).addEventListener(&quot;click&quot;, searchProducts);
document.getElementById(&quot;search-input&quot;).addEventListener(&quot;keypress&quot;, function (e) {
    if (e.key === &quot;Enter&quot;) {
        searchProducts();
    }
});


      
	
      
        // Inisialisasi keranjang
let cart = [];

function loadProducts(query = &quot;&quot;) {
    const menuContainer = document.getElementById(&#39;menu-container&#39;);
    menuContainer.innerHTML = &quot;&quot;; // Bersihkan kontainer sebelum menampilkan hasil baru

    fetch(&#39;/feeds/posts/default?alt=json&#39;)
        .then(response =&gt; response.json())
        .then(data =&gt; {
            const posts = data.feed.entry;
            const categorizedProducts = {};

            posts.forEach(post =&gt; {
                const content = post.content.$t;

                // Parsing nama produk
                const titleMatch = content.match(/&lt;h2&gt;(.*?)&lt;\/h2&gt;/);
                const title = titleMatch ? titleMatch[1] : &#39;Produk Tanpa Nama&#39;;
      
      			// Jika ada kata kunci pencarian, pastikan produk sesuai dengan kata kunci
                if (query &amp;&amp; !title.toLowerCase().includes(query.toLowerCase())) {
                    return; // Lewati produk yang tidak cocok dengan kata kunci
                }

                // Parsing URL gambar produk
                const imgMatch = content.match(/&lt;img.*?src=&quot;(.*?)&quot;/);
                const imgSrc = imgMatch ? imgMatch[1] : &#39;https://via.placeholder.com/100&#39;;

                // Parsing harga produk
                const priceMatch = content.match(/Harga\/Rp\.?\d+/i);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/[^\d]/g, &#39;&#39;)) : 0;

                // Parsing label/kategori
                const labels = post.category ? post.category.map(cat =&gt; cat.term) : [&#39;Uncategorized&#39;];

                // Parsing variasi produk
                const variationMatch = content.match(/&lt;ul class=&quot;variations&quot;&gt;(.*?)&lt;\/ul&gt;/s);
                const variations = variationMatch ? variationMatch[1].match(/&lt;li&gt;(.*?)&lt;\/li&gt;/g).map(v =&gt; {
                    const [variationName, variationPrice] = v.replace(/&lt;\/?li&gt;/g, &#39;&#39;).split(&#39; - Rp&#39;);
                    return { name: variationName.trim(), price: parseInt(variationPrice) };
                }) : [];

                // Parsing topping produk
                const toppingMatch = content.match(/&lt;ul class=&quot;toppings&quot;&gt;(.*?)&lt;\/ul&gt;/s);
                const toppings = toppingMatch ? toppingMatch[1].match(/&lt;li&gt;(.*?)&lt;\/li&gt;/g).map(t =&gt; {
                    const [toppingName, toppingPrice] = t.replace(/&lt;\/?li&gt;/g, &#39;&#39;).split(&#39; - Rp&#39;);
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
                labels.forEach(label =&gt; {
                    if (!categorizedProducts[label]) {
                        categorizedProducts[label] = [];
                    }
                    categorizedProducts[label].push(product);
                });
            });

            // Tampilkan produk berdasarkan kategori di halaman
            for (const [category, products] of Object.entries(categorizedProducts)) {
                // Membuat elemen judul kategori
                const categoryTitle = document.createElement(&#39;h3&#39;);
                categoryTitle.className = &#39;category-title&#39;;
                categoryTitle.textContent = category;
                menuContainer.appendChild(categoryTitle);

                // Membuat kontainer produk untuk kategori
                const categoryContainer = document.createElement(&#39;div&#39;);
                categoryContainer.className = &#39;category-container&#39;;

                products.forEach(product =&gt; {
                    // Membuat elemen item menu
                    const menuItem = document.createElement(&#39;div&#39;);
                    menuItem.className = &#39;menu-item d-flex justify-content-between mb-4 align-items-start&#39;;
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

            // Event listener untuk tombol &quot;Beli&quot;
            document.querySelectorAll(&#39;.buy-btn&#39;).forEach(button =&gt; {
                button.onclick = (event) =&gt; {
                    const productName = button.getAttribute(&#39;data-title&#39;);
                    const productPrice = parseInt(button.getAttribute(&#39;data-price&#39;));
                    const variations = JSON.parse(button.getAttribute(&#39;data-variations&#39;));
                    const toppings = JSON.parse(button.getAttribute(&#39;data-toppings&#39;));

                    if (variations.length &gt; 0) {
                        showVariationModal(productName, variations, toppings);
                    } else {
                        addToCart(productName, productPrice, event, toppings);
                    }
                };
            });
        });
}



      function showToast(message) {
    const toast = document.getElementById(&#39;toast&#39;);
    toast.textContent = message;
    toast.style.display = &#39;block&#39;;

    // Menghilangkan elemen toast setelah beberapa detik
    setTimeout(() =&gt; {
        toast.style.display = &#39;none&#39;;
    }, 3000); // Toast akan muncul selama 3 detik
}

      	
      
// Fungsi modal variasi dan topping
function showVariationModal(productName, variations, toppings) {
    selectedProduct = { name: productName, variations, toppings };

    const modal = document.getElementById(&#39;variation-modal&#39;);
    const titleElem = document.getElementById(&#39;modal-product-title&#39;);
    const variationSelect = document.getElementById(&#39;product-variation&#39;);

    titleElem.textContent = `Pilih variasi untuk ${productName}`;
    variationSelect.innerHTML = &#39;&#39;;

    variations.forEach(variation =&gt; {
        const option = document.createElement(&#39;option&#39;);
        option.value = JSON.stringify(variation);
        option.textContent = `${variation.name} - Rp${variation.price}`;
        variationSelect.appendChild(option);
    });

    // Menambahkan topping
    const toppingContainer = document.getElementById(&#39;topping-options&#39;);
    toppingContainer.innerHTML = &#39;&#39;; // Bersihkan topping lama
    toppings.forEach(topping =&gt; {
        const toppingElem = document.createElement(&#39;label&#39;);
        toppingElem.className = &#39;d-block&#39;;
        toppingElem.innerHTML = `<input data-price='${topping.price}' type='checkbox' value='${topping.name}'/> ${topping.name} ${topping.price &gt; 0 ? `- Rp${topping.price}` : &#39;&#39;}`;
        toppingContainer.appendChild(toppingElem);
    });

    modal.style.display = &#39;flex&#39;;
}



// Menutup modal variasi produk
function closeVariationModal() {
    document.getElementById(&#39;variation-modal&#39;).style.display = &#39;none&#39;;
}


// Menambahkan produk dengan variasi dan topping ke keranjang
function addVariationToCart() {
    const selectedOption = document.getElementById(&#39;product-variation&#39;).value;
    const selectedVariation = JSON.parse(selectedOption);

    // Ambil topping yang dipilih dan hitung total harga topping
    const selectedToppings = Array.from(document.querySelectorAll(&#39;#topping-options input:checked&#39;)).map(t =&gt; {
        return { name: t.value, price: parseInt(t.getAttribute(&#39;data-price&#39;)) || 0 };
    });
    const totalToppingPrice = selectedToppings.reduce((total, topping) =&gt; total + topping.price, 0);

    // Tambahkan ke keranjang dengan nama dan harga total (variasi + topping)
    const productName = `${selectedProduct.name} - ${selectedVariation.name} (Topping: ${selectedToppings.map(t =&gt; t.name).join(&#39;, &#39;)})`;
    const productPrice = selectedVariation.price + totalToppingPrice;

    addToCart(productName, productPrice, { target: document.querySelector(&#39;.cart&#39;) });
    closeVariationModal();
}





        // Fungsi untuk menampilkan atau menyembunyikan popup keranjang
function toggleCartPopup() {
    const cartPopup = document.getElementById(&#39;cart-popup&#39;);
    cartPopup.style.display = (cartPopup.style.display === &#39;block&#39;) ? &#39;none&#39; : &#39;block&#39;;
}
      
      // Menambahkan event listener untuk klik pada keranjang
document.getElementById(&#39;cart&#39;).addEventListener(&#39;click&#39;, function() {
    toggleCartPopup();
});

        function updateCartPopup() {
    const cartItemsContainer = document.getElementById(&#39;cart-items&#39;);
    cartItemsContainer.innerHTML = &#39;&#39;;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = &#39;<p>Keranjang masih kosong.</p>&#39;;
    } else {
        cart.forEach((item, index) =&gt; {
            const cartItem = document.createElement(&#39;div&#39;);
            cartItem.classList.add(&#39;cart-item&#39;);
            cartItem.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>Rp${item.price * item.quantity}</span>
                <button class='remove-btn' onclick='removeItem(${index})'>
                    <i class='fas fa-trash-alt'/>
                </button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });
    }
}


      // Fungsi untuk menambahkan produk ke keranjang dengan animasi
function addToCart(name, price, event) {
    // Cek apakah produk sudah ada di keranjang berdasarkan nama produk
    const existingItem = cart.find(item =&gt; item.name === name);
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
    const flyingItem = document.createElement(&#39;div&#39;);
    flyingItem.classList.add(&#39;flying-item&#39;);
    flyingItem.textContent = &#39;+1&#39;;
    document.body.appendChild(flyingItem);

    const rect = event.target.getBoundingClientRect();
    flyingItem.style.position = &#39;absolute&#39;;
    flyingItem.style.left = `${rect.left + window.scrollX}px`;
    flyingItem.style.top = `${rect.top + window.scrollY}px`;

    const cartRect = document.getElementById(&#39;cart&#39;).getBoundingClientRect();
    const targetX = cartRect.left + cartRect.width / 2;
    const targetY = cartRect.top + cartRect.height / 2;

    requestAnimationFrame(() =&gt; {
        flyingItem.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px)`;
        flyingItem.style.transition = &#39;transform 0.7s ease, opacity 0.7s ease&#39;;
        flyingItem.style.opacity = 0;
    });

    flyingItem.addEventListener(&#39;transitionend&#39;, () =&gt; {
        flyingItem.remove();
    });

    // Update jumlah item di keranjang dan tampilkan pesan sukses
    document.getElementById(&#39;cart-count&#39;).textContent = cart.length;
    showToast(`${name} berhasil ditambahkan ke keranjang!`);
    
    // Update popup keranjang
    updateCartPopup();
}


function removeFromCart(name) {
    // Temukan indeks item berdasarkan nama
    const itemIndex = cart.findIndex(item =&gt; item.name === name);

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
    const totalCount = cart.reduce((sum, item) =&gt; sum + item.quantity, 0);
    document.getElementById(&#39;cart-count&#39;).textContent = totalCount;
    
    // Perbarui tampilan popup keranjang untuk menunjukkan perubahan
    updateCartPopup();
}





// Menutup popup jika mengklik di luar area popup
window.addEventListener(&#39;click&#39;, function(event) {
    const cartPopup = document.getElementById(&#39;cart-popup&#39;);
    const cartButton = document.getElementById(&#39;cart&#39;);
    
    if (!cartPopup.contains(event.target) &amp;&amp; event.target !== cartButton) {
        cartPopup.style.display = &#39;none&#39;;
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
        alert(&#39;Keranjang belanja kosong!&#39;);
        return;
    }

    // Sembunyikan popup keranjang dan tampilkan form pelanggan
    document.getElementById(&#39;cart-popup&#39;).style.display = &#39;none&#39;;
    const customerFormContainer = document.getElementById(&#39;customer-form-container&#39;);
    customerFormContainer.style.display = &#39;flex&#39;; // Tampilkan form

    // Auto-scroll langsung ke form data pelanggan
customerFormContainer.scrollIntoView({ behavior: &#39;smooth&#39; });


    // Tampilkan detail pesanan dan peta
    showOrderSummary();
    initMap(); // Inisialisasi peta
}
      
      // Fungsi untuk membatalkan checkout dan kembali ke tampilan keranjang
    function cancelCheckout() {
        document.getElementById(&#39;customer-form-container&#39;).style.display = &#39;none&#39;;
        document.getElementById(&#39;cart-popup&#39;).style.display = &#39;block&#39;;
    }
      
      // Fungsi untuk menghitung ongkos kirim
    function calculateShippingCost(distance) {
        const cost = minimalTarif + (tarifPerKm * distance);
        return cost &lt; minimalTarif ? minimalTarif : Math.round(cost);
    }
      
       // Fungsi untuk memperbarui total pembayaran
    function updateTotalPayment(shippingCost) {
        // Hitung total harga pesanan
        const orderTotal = cart.reduce((total, item) =&gt; total + (item.price * item.quantity), 0);
        document.getElementById(&#39;order-total&#39;).textContent = `Rp${orderTotal}`;

        // Hitung total pembayaran
        const totalPayment = orderTotal + shippingCost;
        document.getElementById(&#39;total-payment&#39;).value = `Rp${totalPayment}`;
    }
      
      // Fungsi untuk menampilkan detail pesanan dan total harga
    function showOrderSummary() {
        const orderItemsContainer = document.getElementById(&#39;order-items&#39;);
        const orderTotalElement = document.getElementById(&#39;order-total&#39;);
        orderItemsContainer.innerHTML = &#39;&#39;;

        let totalAmount = 0;
        cart.forEach(item =&gt; {
            const listItem = document.createElement(&#39;li&#39;);
            listItem.className = &#39;list-group-item d-flex justify-content-between align-items-center&#39;;
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
    const name = document.getElementById(&#39;name&#39;).value;
    const address = document.getElementById(&#39;address&#39;).value;
    const latitude = document.getElementById(&#39;latitude&#39;).value;
    const longitude = document.getElementById(&#39;longitude&#39;).value;
    const shippingCost = document.getElementById(&#39;shipping-cost&#39;).value;
    const totalPayment = document.getElementById(&#39;total-payment&#39;).value;

    // Periksa apakah data pelanggan sudah lengkap
    if (!name || !address || !latitude || !longitude) {
        alert(&#39;Mohon lengkapi data pelanggan!&#39;);
        return;
    }

    // Buat link lokasi Google Maps
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Buat rincian pesan pesanan
    let orderDetails = &#39;Pesanan Anda:\n&#39;;
    cart.forEach((item, index) =&gt; {
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
    const whatsappNumber = &#39;62895343019273&#39;; // Nomor WhatsApp dalam format internasional

    // URL WhatsApp
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    // Arahkan ke WhatsApp
    window.open(whatsappURL, &#39;_blank&#39;);
}

      
       // Fungsi untuk inisialisasi peta Leaflet
    function initMap() {
        const map = L.map(&#39;map&#39;).setView([restoLat, restoLng], 13);
        L.tileLayer(&#39;https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png&#39;, {
            maxZoom: 18,
            attribution: &#39;&#169; OpenStreetMap&#39;
        }).addTo(map);

        // Tambahkan marker untuk resto
        L.marker([restoLat, restoLng]).addTo(map).bindPopup(&quot;Resto&quot;).openPopup();

        // Cek Geolocation pengguna
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) =&gt; {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                // Tambahkan marker pengguna
                const userMarker = L.marker([userLat, userLng], { draggable: true }).addTo(map)
                    .bindPopup(&quot;Lokasi Anda&quot;).openPopup();
                map.setView([userLat, userLng], 15);

                // Tampilkan koordinat
                document.getElementById(&#39;latitude&#39;).value = userLat;
                document.getElementById(&#39;longitude&#39;).value = userLng;

                // Hitung ongkos kirim
                const distance = map.distance([userLat, userLng], [restoLat, restoLng]) / 1000;
                const shippingCost = calculateShippingCost(distance);
                document.getElementById(&#39;shipping-cost&#39;).value = `Rp${shippingCost}`;

                // Hitung total pembayaran
                updateTotalPayment(shippingCost);

                // Event saat marker dipindahkan
                userMarker.on(&#39;move&#39;, function(e) {
                    const newLat = e.latlng.lat.toFixed(6);
                    const newLng = e.latlng.lng.toFixed(6);
                    document.getElementById(&#39;latitude&#39;).value = newLat;
                    document.getElementById(&#39;longitude&#39;).value = newLng;

                    const newDistance = map.distance([newLat, newLng], [restoLat, restoLng]) / 1000;
                    const newShippingCost = calculateShippingCost(newDistance);
                    document.getElementById(&#39;shipping-cost&#39;).value = `Rp${newShippingCost}`;
                    updateTotalPayment(newShippingCost);
                });
            }, () =&gt; {
                alert(&#39;Gagal mendeteksi lokasi, silakan isi alamat secara manual.&#39;);
            });
        } else {
            alert(&#39;Geolocation tidak didukung oleh browser ini.&#39;);
        }
    }

        // Panggil fungsi untuk load produk saat halaman dimuat
window.onload = function() {
    loadProducts();
    document.getElementById(&#39;customer-form-container&#39;).style.display = &#39;none&#39;;
}
