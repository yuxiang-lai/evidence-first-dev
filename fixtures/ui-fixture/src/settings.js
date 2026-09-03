const saveButton = document.querySelector('[data-action="save"]');
const status = document.querySelector("#status");

saveButton?.addEventListener("click", () => {
  status.textContent = "Saved";
});
