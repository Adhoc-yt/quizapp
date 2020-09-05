element = document.getElementById("buzzer");
element.addEventListener("click", function(e) {
  e.preventDefault;
  element.classList.remove("animate");
  void element.offsetWidth;
  element.classList.add("animate");
}, false);

