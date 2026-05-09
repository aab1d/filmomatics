const register = document.getElementById("register-form");
if (register) {
  register.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    if (name.trim().length < 2) {
      alert("Name must be at least 2 characters.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }
    const btn = register.querySelector("button");
    btn.disabled = true;
    btn.textContent = "Registering...";
    try {
      const userResponse = await fetch(`${API_BASE}/users`);
      const data = await userResponse.json();
      const existingUser = data.find((user) => user.email === email);
      if (existingUser) {
        alert("User already Registered");
        return;
      }
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      if (response.ok) {
        alert("User Registered Successfully!");
        window.location.href = "login.html";
      } else {
        console.error("Registration Failed", response.status);
      }
    } catch (error) {
      console.error("Registration error:", error.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Register";
    }
  });
}
const login = document.getElementById("login-form");
if (login) {
  login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch(`${API_BASE}/users`);
      const users = await response.json();
      const user = users.find(
        (user) => user.email === email && user.password === password,
      );
      if (user) {
        localStorage.setItem("loggedInUser", JSON.stringify(user));
        window.location.href = "../index.html";
      } else {
        alert("Invalid Email or Password!");
      }
    } catch (error) {
      console.error(error.message);
    }
    console.log(email, password);
  });
}
