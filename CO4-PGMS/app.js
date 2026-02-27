
import multiply, { add, PI } from "./math.js"; //{} for named functions, default no nee dof  {}

//document.writeln("Value of PI: " + PI + "<br>");
//document.writeln("Addition (5 + 3): " + add(5, 3) + "<br>");
//document.writeln("Multiplication (4 × 6): " + multiply(4, 6));

document.body.innerHTML +=
  "Value of PI: " + PI + "<br>" +
  "Addition (5 + 3): " + add(5, 3) + "<br>" +
  "Multiplication (4 × 6): " + multiply(4, 6);