
export function renderLogin(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-screen">
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">Kas-iQ</div>
          <h1>Selamat Datang Kembali</h1>
          <p>Masuk ke akun prototype kamu</p>
        </div>
        
        <form id="login-form" class="login-form">
          <div class="form-group">
            <label>Username</label>
            <input type="text" id="username" placeholder="Masukkan username (admin)" required>
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="password" placeholder="Masukkan password (admin)" required>
          </div>

          <div id="login-error" class="login-error" style="display: none;">
            Username atau password salah! (Gunakan: admin/admin)
          </div>
          
          <button type="submit" class="login-btn">Masuk Sekarang</button>
        </form>

        <div class="login-footer">
          <div class="demo-hint" style="background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px; margin-bottom: 20px; font-size: 0.85rem; border: 1px dashed #ccc;">
            <p style="margin:0; font-weight: 600; color: #555;">💡 Demo Access:</p>
            <p style="margin:5px 0 0; color: #777;">Username: <strong>admin</strong> | Password: <strong>admin</strong></p>
          </div>
          <p>&copy; 2026 Kas-iQ Digital Finance Prototype</p>
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorMsg = container.querySelector('#login-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = container.querySelector('#username').value;
    const pass = container.querySelector('#password').value;

    // Dummy Authentication
    if (user === 'admin' && pass === 'admin') {
      onLoginSuccess();
    } else {
      errorMsg.style.display = 'block';
      setTimeout(() => {
        errorMsg.style.display = 'none';
      }, 3000);
    }
  });
}
