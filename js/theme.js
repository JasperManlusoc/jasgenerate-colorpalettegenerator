const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

// load saved theme
if (localStorage.getItem("theme") === "dark") {
  root.classList.add("dark");
}

themeToggle.addEventListener("click", () => {
  if (root.classList.contains("dark")) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
});