import multiply, { add } from "./math.js";
const btn = document.getElementById("calculateBtn");
btn.addEventListener("click", function () {

  let abc1 = Number(document.getElementById("num1").value);
  let abc2 = Number(document.getElementById("num2").value);

  let sum = add(abc1, abc2);
  let product = multiply(abc1, abc2);

  document.getElementById("result").innerHTML =
    "Addition: " + sum + "<br>" +
    "Multiplication: " + product;

});