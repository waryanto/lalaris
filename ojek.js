var map, senderMarker, receiverMarkers = [], senderLocation, receiverLocations = [], directionsService, directionsRenderer, geocoder;
    var weatherFee = 0;
    var baseRatePerKm = 2500;
    var additionalRatePerKm = 1000;
    var minLocationFee = 1000;

    function initializeMapWithUserLocation() {
        initGooglePlacesAutocomplete(document.getElementById('senderAddress'), updateSenderMarker);
        initGooglePlacesAutocomplete(document.getElementById('receiverAddress1'), updateReceiverMarker, 0);

        map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: -6.200000, lng: 106.816666 },
            zoom: 12,
            disableDefaultUI: true,
            mapTypeControl: false
        });

        directionsService = new google.maps.DirectionsService();
        directionsRenderer = new google.maps.DirectionsRenderer({
            map: map,
            suppressMarkers: true
        });
        geocoder = new google.maps.Geocoder();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.setCenter(userLatLng);
                map.setZoom(15);
                updateSenderMarker(userLatLng);
                geocodeLatLng(userLatLng, 'sender');
                getWeatherCondition(userLatLng.lat(), userLatLng.lng());
            }, function() {
                alert('Tidak dapat mendeteksi lokasi. Peta akan diatur ke Jakarta.');
            });
        } else {
            alert('Geolocation tidak didukung oleh browser Anda.');
        }

        map.addListener('click', function(e) {
            var index = receiverMarkers.length;
            if (document.getElementById(`receiverAddress${index + 1}`)) {
                if (index < 5) {
                    updateReceiverMarker(e.latLng, index);
                    geocodeLatLng(e.latLng, 'receiver', index);
                    calculateRoute();  // Memperbarui jarak dan harga setiap kali lokasi tujuan berubah
                }
            } else {
                alert('Silakan tambahkan form lokasi tujuan sebelum menambahkan marker pada peta.');
            }
        });
    }

    function initGooglePlacesAutocomplete(inputElement, updateMarkerFunction, index) {
        var autocomplete = new google.maps.places.Autocomplete(inputElement);
        autocomplete.addListener('place_changed', function() {
            var place = autocomplete.getPlace();
            if (!place.geometry) {
                alert("Nama tempat tidak ditemukan, silakan pilih tempat yang valid.");
                return;
            }
            var latlng = place.geometry.location;
            updateMarkerFunction(latlng, index);
            map.setCenter(latlng);
            map.setZoom(15);
            if (senderLocation && receiverLocations.length > 0) calculateRoute();  // Memperbarui jarak dan harga setiap kali lokasi pemesan atau tujuan berubah
        });
    }

    function updateSenderMarker(latlng) {
        var senderIcon = {
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
        };

        if (!senderMarker) {
            senderMarker = new google.maps.Marker({
                position: latlng,
                map: map,
                title: 'Pemesan',
                icon: senderIcon,
                draggable: true
            });
            senderMarker.addListener('dragend', function() {
                senderLocation = senderMarker.getPosition();
                document.getElementById('senderAddress').value = `${senderLocation.lat().toFixed(6)}, ${senderLocation.lng().toFixed(6)}`;
                geocodeLatLng(senderLocation, 'sender');
                getWeatherCondition(senderLocation.lat(), senderLocation.lng());
                calculateRoute();  // Memperbarui jarak dan harga saat marker sender dipindahkan
            });
        } else {
            senderMarker.setPosition(latlng);
        }
        senderLocation = latlng;
        calculateRoute();  // Memperbarui jarak dan harga saat marker sender diperbarui
    }

    function updateReceiverMarker(latlng, index) {
        var receiverIcon = {
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
        };

        if (!receiverMarkers[index]) {
            var marker = new google.maps.Marker({
                position: latlng,
                map: map,
                title: `Tujuan ${index + 1}`,
                icon: receiverIcon,
                draggable: true
            });
            marker.addListener('dragend', function() {
                receiverLocations[index] = marker.getPosition();
                document.getElementById(`receiverAddress${index + 1}`).value = `${receiverLocations[index].lat().toFixed(6)}, ${receiverLocations[index].lng().toFixed(6)}`;
                geocodeLatLng(receiverLocations[index], 'receiver', index);
                calculateRoute();  // Memperbarui jarak dan harga saat marker receiver dipindahkan
            });
            receiverMarkers[index] = marker;
        } else {
            receiverMarkers[index].setPosition(latlng);
        }
        receiverLocations[index] = latlng;
        calculateRoute();  // Memperbarui jarak dan harga saat marker receiver diperbarui
    }

    
    
   


        function geocodeLatLng(latlng, type, index) {
            geocoder.geocode({ 'location': latlng }, function(results, status) {
                if (status === 'OK') {
                    if (results[0]) {
                        if (type === 'sender') {
                            document.getElementById('senderAddress').value = results[0].formatted_address;
                        } else if (type === 'receiver') {
                            document.getElementById(`receiverAddress${index + 1}`).value = results[0].formatted_address;
                        }
                    } else {
                        alert('Alamat tidak ditemukan.');
                    }
                } else {
                    alert('Geocoder gagal karena: ' + status);
                }
            });
        }

        function calculateRoute() {
        // Pastikan ada lokasi pemesan dan minimal satu lokasi tujuan
        if (!senderLocation || receiverLocations.length === 0) return;

        // Tambahkan semua lokasi tujuan sebagai waypoints kecuali tujuan terakhir
        var waypoints = receiverLocations.slice(0, -1).map(location => ({
            location: location,
            stopover: true
        }));

        // Buat permintaan rute untuk menghitung jarak dengan semua waypoints
        var request = {
            origin: senderLocation,
            destination: receiverLocations[receiverLocations.length - 1], // Tujuan akhir
            waypoints: waypoints,
            travelMode: 'DRIVING',
            optimizeWaypoints: false, // Jangan optimalkan urutan waypoint
            avoidTolls: true,
            avoidHighways: false
        };

        // Panggil Google Directions API untuk menghitung rute
        directionsService.route(request, function(result, status) {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
                
                // Hitung total jarak dari semua legs (segment rute)
                var totalDistance = 0;
                var legs = result.routes[0].legs;
                for (var i = 0; i < legs.length; i++) {
                    totalDistance += legs[i].distance.value / 1000; // Konversi meter ke kilometer
                }
                var roundedDistance = Math.round(totalDistance);
                document.getElementById('distance').innerText = roundedDistance;

                // Hitung biaya pengiriman berdasarkan jarak dan jumlah tujuan
                var shippingCost = Math.max((baseRatePerKm + (receiverLocations.length - 1) * additionalRatePerKm) * roundedDistance, 8000) + weatherFee;
                if (receiverLocations.length > 1) {
                    shippingCost += (receiverLocations.length - 1) * minLocationFee;
                }
                document.getElementById('totalShippingCost').innerText = shippingCost;
            } else {
                alert('Gagal menghitung rute. Coba lagi.');
            }
        });
    }

        function addDestination() {
    var index = receiverMarkers.length;
    if (index >= 5) return; // Batas maksimal 5 tujuan

    // Cek apakah ada label dengan nama yang sama
    var existingLabel = document.querySelector(`label[for="receiverAddress${index + 1}"]`);
    if (existingLabel) {
        alert(`Isi alamat tujuan dulu, baru bisa nambah tujuan baru.`);
        return;
    }

    // Cek apakah lokasi tujuan sebelumnya sudah diisi
    var previousAddress = document.getElementById(`receiverAddress${index}`).value;
    if (!previousAddress) {
        alert(`Harap isi alamat tujuan ${index} terlebih dahulu sebelum menambahkan tujuan baru.`);
        document.getElementById(`receiverAddress${index}`).focus();
        return;
    }

    // Jika semua validasi lolos, tambahkan form baru
    var newDestination = document.createElement('div');
    newDestination.className = 'form-group';
    newDestination.innerHTML = `
        <label for="receiverAddress${index + 1}">Alamat Tujuan ${index + 1}</label>
        <div class="input-group">
            <input class="form-control receiverAddress" id="receiverAddress${index + 1}" placeholder="Cari di sini atau klik di peta" type="text" required />
            <div class="input-group-append">
                <button class="btn btn-outline-secondary" onclick="clearReceiverAddress(${index})"><i class="fas fa-times"></i></button>
                <button class="btn btn-outline-danger" onclick="removeDestination(${index})"><i class="fas fa-minus"></i></button>
            </div>
            <div class="input-group-append">
                <button class="btn btn-primary useMyLocationReceiver" data-index="${index}" onclick="useMyLocation('receiver', ${index})"><i class="fas fa-crosshairs text-white"></i></button>
            </div>
        </div>
    `;
    document.getElementById('additionalDestinations').appendChild(newDestination);
    initGooglePlacesAutocomplete(document.getElementById(`receiverAddress${index + 1}`), updateReceiverMarker, index);
}





        function removeDestination(index) {
    // Cek apakah form tujuan ada
    var receiverAddressInput = document.getElementById(`receiverAddress${index + 1}`);
    
    // Jika form ada, hapus marker dan form tanpa perlu mengecek apakah alamat sudah diisi atau belum
    if (receiverAddressInput) {
        if (receiverMarkers[index]) {
            receiverMarkers[index].setMap(null);
            receiverMarkers.splice(index, 1);
            receiverLocations.splice(index, 1);
        }
        receiverAddressInput.parentElement.parentElement.remove();
        calculateRoute();
    }
}


        function clearSenderAddress() {
            document.getElementById('senderAddress').value = '';
            if (senderMarker) {
                senderMarker.setMap(null);
                senderMarker = null;
                senderLocation = null;
                directionsRenderer.set('directions', null);
            }
        }

        function clearReceiverAddress(index) {
            document.getElementById(`receiverAddress${index + 1}`).value = '';
            if (receiverMarkers[index]) {
                receiverMarkers[index].setMap(null);
                receiverMarkers[index] = null;
                receiverLocations[index] = null;
                directionsRenderer.set('directions', null);
            }
        }

        function useMyLocation(type, index = null) {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    var userLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    if (type === 'sender') {
                        updateSenderMarker(userLatLng);
                        geocodeLatLng(userLatLng, 'sender');
                    } else if (type === 'receiver' && index !== null) {
                        updateReceiverMarker(userLatLng, index);
                        geocodeLatLng(userLatLng, 'receiver', index);
                    }
                    map.setCenter(userLatLng);
                    map.setZoom(15);
                }, function() {
                    alert('Tidak dapat mendeteksi lokasi.');
                });
            } else {
                alert('Geolocation tidak didukung oleh browser Anda.');
            }
        }

        function goToPage2() {
            if (!senderLocation || receiverLocations.length === 0) {
                alert('Harap lengkapi alamat pemesan dan tujuan.');
                return;
            }
            document.getElementById('page1').style.display = 'none';
            document.getElementById('page2').style.display = 'block';
        }

        function goToPage1() {
            document.getElementById('page2').style.display = 'none';
            document.getElementById('page1').style.display = 'block';
        }
      	
      	// Fungsi untuk tombol kembali
        function goBack() {
            window.location.href = window.location.origin;
        }

        function sendToWhatsApp() {
            var senderName = document.getElementById('senderName').value;
            var senderAddress = document.getElementById('senderAddress').value;
            var senderLocationLink = `https://www.google.com/maps?q=${senderLocation.lat()},${senderLocation.lng()}`;
            var receiverAddresses = receiverLocations.map((location, index) => document.getElementById(`receiverAddress${index + 1}`).value);
            var receiverLocationLinks = receiverLocations.map(location => `https://www.google.com/maps?q=${location.lat()},${location.lng()}`);
            var paymentType = document.getElementById('paymentType').value;
            var serviceType = document.getElementById('serviceType').value;
            var courierNotes = document.getElementById('courierNotes').value;
            var distance = document.getElementById('distance').innerText;
            var totalShippingCost = document.getElementById('totalShippingCost').innerText;

            if (!senderName || !senderAddress || receiverAddresses.length === 0) {
                alert('Harap lengkapi semua informasi yang diperlukan.');
                return;
            }

            var message = `Halo, saya mau pesan Ojek.
` +
                `Nama Pemesan: ${senderName}
` +
                `Alamat Pemesan: ${senderAddress}
` +
                `Link Lokasi Pemesan: ${senderLocationLink}
`;

            receiverAddresses.forEach((address, index) => {
                message += `Alamat Tujuan ${index + 1}: ${address}
`;
            });

            receiverLocationLinks.forEach((link, index) => {
                message += `Link Lokasi Tujuan ${index + 1}: ${link}
`;
            });

            message += `Opsi Pembayaran: ${paymentType}
` +
                `Layanan: ${serviceType}
` +
                `Catatan: ${courierNotes}
` +
                `Jarak Rute: ${distance} km
` +
                `Total Tarif: Rp ${totalShippingCost}`;

            var whatsappUrl = `https://wa.me/62895343019273?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }

        initializeMapWithUserLocation();