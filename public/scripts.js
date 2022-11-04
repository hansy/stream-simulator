$(document).ready(function () {
  const formEl = $("#form");

  formEl.on("submit", (e) => {
    e.preventDefault();
    const streamKey = $("#streamKeyInput").val();

    $.ajax({
      method: "POST",
      url: `${window.location}stream`,
      data: JSON.stringify({ streamKey }),
      contentType: "application/json",
      complete: (res) => {
        const { status } = res.responseJSON;
        const statusEl = $("#status");

        statusEl.html(`Stream status: ${status}`);
        formEl[0].reset();
      },
    });
  });
});
