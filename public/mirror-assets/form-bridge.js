(function () {
  function asObject(formData) {
    var result = {};

    formData.forEach(function (value, key) {
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    });

    return result;
  }

  function pageSlugFromPath() {
    if (window.location.pathname === "/wedding") return "wedding";
    if (window.location.pathname === "/corporate") return "corporate";
    return "home";
  }

  function showSuccess(form) {
    var successBox = form.querySelector(".js-successbox, .t-form__successbox");
    if (successBox) {
      successBox.style.display = "block";
    } else {
      window.alert("Заявка отправлена");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var forms = document.querySelectorAll("form.t-form");

    forms.forEach(function (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();

        var formData = new FormData(form);
        var payload = asObject(formData);

        try {
          var response = await fetch("/api/inquiry", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              pageSlug: pageSlugFromPath(),
              payload: payload,
            }),
          });

          if (!response.ok) {
            throw new Error("Request failed");
          }

          form.reset();
          showSuccess(form);
        } catch (error) {
          console.error(error);
          window.alert("Не удалось отправить заявку. Попробуйте еще раз.");
        }
      });
    });
  });
})();
