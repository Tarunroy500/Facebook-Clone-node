const show = () => {
  const form = document.querySelector("#signup");
  form.classList.toggle("show");
  document.querySelector(".layer").style.display = "block";
};

const hide = () => {
  const hide = document.querySelector(".show");
  hide.classList.remove("show");
  document.querySelector(".layer").style.display = "none";
};

var form = document.querySelector(".signup_form");
var otpcnt = document.querySelector(".otp");
var otpform = document.querySelector("#otp-form");
const signup = async (e) => {
  e.preventDefault();
  const {
    email,
    password,
    firstname,
    lastname,
    phone,
    gender,
    month,
    day,
    year,
  } = e.target;
  const user = {
    email: email.value,
    password: password.value,
    firstname: firstname.value,
    lastname: lastname.value,
    phone: phone.value,
    birthdate: `${day.value}-${month.value}-${year.value}`,
    gender: gender.value,
  };console.log(user);
  await axios
    .post("/signup", user)
    .then((res) => {
      if (res.data.message === "success") {
        otpcnt.style.display = "flex";
        otpcnt.setAttribute("data-phone", phone.value);
        document.querySelector(".signup").style.display = "none";
      }
    })
    .catch((err) => console.log(err));
};

const verifyotp = (e) => {
  e.preventDefault();
  const { otp } = e.target;
  const user = {
    otp: otp.value,
    phone: otpcnt.getAttribute("data-phone"),
  };
  console.log(user);
  axios
    .post("/verifyotp", user)
    .then((res) => {
      console.log(res.data);
      if (res.data.message === "success") {
        window.location.href = "/home";
      } else {
        alert("Invalid OTP");
      }
    })
    .catch((err) => console.log(err));
};

form.addEventListener("submit", signup);
otpform.addEventListener("submit", verifyotp);
