document.getElementById('uploadBtn').addEventListener('click', async () => {
    const imageUrl = document.getElementById('imageUrl').value;
    const imageFile = document.getElementById('imageFile').files[0];
    const description = document.getElementById('description').value;
    const status = document.getElementById('status');

    let finalImageUrl = imageUrl;

    status.textContent = 'Uploading...';
    status.style.color = 'blue';

    try {
        if (imageFile) {
            // Convert file to base64
            finalImageUrl = await toBase64(imageFile);
        }

        if (!finalImageUrl && !description) {
            status.textContent = 'Please provide an image or description.';
            status.style.color = 'red';
            return;
        }

        const response = await fetch('https://memory-wall-extention-1.onrender.com/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageUrl: finalImageUrl, description })
        });

        if (response.ok) {
            status.textContent = 'Memory Added!';
            status.style.color = 'green';
            document.getElementById('imageUrl').value = '';
            document.getElementById('imageFile').value = '';
            document.getElementById('description').value = '';
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error(error);
        status.textContent = 'Error connecting to server. Is it running?';
        status.style.color = 'red';
    }
});

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});
