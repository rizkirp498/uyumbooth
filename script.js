const screenSelect = document.getElementById('screen-select');
const screenCamera = document.getElementById('screen-camera');
const screenResult = document.getElementById('screen-result');

const frameCards = document.querySelectorAll('.frame-card');
const kamera = document.getElementById('kamera');
const kanvasFoto = document.getElementById('kanvasFoto');
const ctx = kanvasFoto.getContext('2d');

const statusJepret = document.getElementById('statusJepret');
const btnStartGame = document.getElementById('btnStartGame');
const btnCapture = document.getElementById('btnCapture');
const btnBackToSelect = document.getElementById('btnBackToSelect');
const btnDownload = document.getElementById('btnDownload');
const btnReplay = document.getElementById('btnReplay');

const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');

let selectedTemplate = 'strip1.svg'; 
let stream = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

frameCards.forEach(card => {
    card.addEventListener('click', function() {
        frameCards.forEach(c => c.classList.remove('selected'));
        this.classList.add('selected');
        selectedTemplate = this.getAttribute('data-frame');
    });
});

btnStartGame.addEventListener('click', async function() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        kamera.srcObject = stream;
        
        screenSelect.classList.remove('active');
        screenCamera.classList.add('active');
        statusJepret.innerText = "GET READY!";
    } catch (error) {
        console.error(error);
        alert("Gagal akses kamera! Pastikan izin kamera sudah diberikan.");
    }
});

btnCapture.addEventListener('click', async function() {
    btnCapture.style.display = 'none';
    btnBackToSelect.style.display = 'none';
    
    let kumpulanFoto = [];

    for (let i = 1; i <= 3; i++) {
        statusJepret.innerText = `PHOTO ${i} OF 3`;
        
        for (let hitung = 3; hitung > 0; hitung--) {
            countdownEl.innerText = hitung;
            countdownEl.classList.remove('hidden');
            await sleep(1000);
        }
        countdownEl.classList.add('hidden');

        flashEl.classList.remove('hidden');
        flashEl.classList.add('flash-anim');
        await sleep(100);

        let tempCanvas = document.createElement('canvas');
        tempCanvas.width = 640;
        tempCanvas.height = 480;
        let tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.translate(640, 0); 
        tempCtx.scale(-1, 1);      
        
        const videoRatio = kamera.videoWidth / kamera.videoHeight;
        const canvasRatio = 640 / 480;
        let sWidth = kamera.videoWidth;
        let sHeight = kamera.videoHeight;
        let sx = 0;
        let sy = 0;

        if (videoRatio > canvasRatio) {
            sWidth = kamera.videoHeight * canvasRatio;
            sx = (kamera.videoWidth - sWidth) / 2;
        } else {
            sHeight = kamera.videoWidth / canvasRatio;
            sy = (kamera.videoHeight - sHeight) / 2;
        }

        tempCtx.drawImage(kamera, sx, sy, sWidth, sHeight, 0, 0, 640, 480);
        kumpulanFoto.push(tempCanvas);

        await sleep(400); 
        flashEl.classList.remove('flash-anim');
        flashEl.classList.add('hidden');

        if(i < 3) await sleep(1000); 
    }

    buatStripFinal(kumpulanFoto);
});

function buatStripFinal(photos) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, kanvasFoto.width, kanvasFoto.height);

    ctx.drawImage(photos[0], 0, 0, 640, 480, 30, 30, 420, 315);
    ctx.drawImage(photos[1], 0, 0, 640, 480, 30, 375, 420, 315);
    ctx.drawImage(photos[2], 0, 0, 640, 480, 30, 720, 420, 315);

    const imgOverlay = new Image();
    imgOverlay.src = selectedTemplate;
    imgOverlay.onload = function() {
        ctx.drawImage(imgOverlay, 0, 0, kanvasFoto.width, kanvasFoto.height);
        
        screenCamera.classList.remove('active');
        screenResult.classList.add('active');
        
        if(stream) { stream.getTracks().forEach(track => track.stop()); }
        
        btnCapture.style.display = 'inline-block';
        btnBackToSelect.style.display = 'inline-block';
    };
    
    imgOverlay.onerror = function() {
        alert("File " + selectedTemplate + " tidak ditemukan!");
    };
}

btnBackToSelect.addEventListener('click', () => {
    screenCamera.classList.remove('active');
    screenSelect.classList.add('active');
    if(stream) { stream.getTracks().forEach(track => track.stop()); }
});

btnReplay.addEventListener('click', () => {
    screenResult.classList.remove('active');
    screenSelect.classList.add('active');
});

btnDownload.addEventListener('click', async () => {
    const dataURI = kanvasFoto.toDataURL('image/png');

    // Cek apakah fitur Share bawaan HP tersedia
    if (navigator.share) {
        try {
            // Ubah gambar Canvas jadi format File yang bisa dibaca galeri HP
            const response = await fetch(dataURI);
            const blob = await response.blob();
            const file = new File([blob], 'Uyumbooth_Arcade.png', { type: 'image/png' });

            // Munculkan menu Share/Save bawaan HP
            await navigator.share({
                files: [file],
                title: 'Uyumbooth Moment'
            });
            return; // Berhenti di sini kalau sukses pakai fitur Share
        } catch (error) {
            console.log('Batal share atau error:', error);
            // Kalau user batalin menu share, lanjut ke cara biasa di bawah
        }
    }

    // Cara biasa (jalan lancar buat buka di Laptop/PC)
    const link = document.createElement('a');
    link.download = 'Uyumbooth_Arcade.png';
    link.href = dataURI;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Kasih tau trik pamungkas buat HP kalau semuanya gagal
    alert("TIPS: Kalau fotonya tidak masuk galeri, tekan dan tahan fotonya di layar, lalu pilih 'Simpan Gambar' / 'Add to Photos' ya wok!");
});
