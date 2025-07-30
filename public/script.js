document.addEventListener('DOMContentLoaded', function () {
    const isNewCheckbox = document.getElementById("isNew");
    const destinationField = document.getElementById("destinationField");
    const parentField = document.getElementById("parentField");
    const form = document.getElementById("packetForm");
    const submitBtn = document.getElementById("submitBtn");
    const responseDiv = document.getElementById("response");

    const touchedFields = new Set();

    function toggleFields() {
        if (isNewCheckbox.checked) {
            destinationField.classList.remove("hidden");
            parentField.classList.add("hidden");
        } else {
            parentField.classList.remove("hidden");
            destinationField.classList.add("hidden");
        }
        checkFormValidity();
    }

    function checkFormValidity() {
        let isValid = true;

        const packetName = document.getElementById("packetName");
        const batchNum = document.getElementById("batchNum");

        if (isNewCheckbox.checked) {
            const destinationFolderId = document.getElementById("destinationFolderId");
            if (!destinationFolderId.value.trim()) {
                isValid = false;
            }
        } else {
            const parentPacketId = document.getElementById("parentPacketId");
            if (!parentPacketId.value.trim()) {
                isValid = false;
            }
        }

        if (!packetName.value.trim()) {
            isValid = false;
        }

        if (!batchNum.value.trim()) {
            isValid = false;
        }

        const assetsSelected = document.querySelectorAll('input[name="assetsToCreate"]:checked');
        if (assetsSelected.length === 0) {
            isValid = false;
        }

        submitBtn.disabled = !isValid;
        return isValid;
    }

    function validateField(field) {
        if (touchedFields.has(field.id)) {
            if (!field.value.trim()) {
                field.classList.add('empty-input');
            } else {
                field.classList.remove('empty-input');
            }
        }
    }

    toggleFields();

    isNewCheckbox.addEventListener("change", toggleFields);

    const requiredFields = [
        document.getElementById("destinationFolderId"),
        document.getElementById("parentPacketId"),
        document.getElementById("packetName"),
        document.getElementById("batchNum")
    ];

    requiredFields.forEach(field => {
        field.addEventListener("blur", function () {
            touchedFields.add(field.id);
            validateField(field);
        });

        field.addEventListener("input", function () {
            validateField(field);
            checkFormValidity();
        });
    });

    document.querySelectorAll('input[name="assetsToCreate"]').forEach(checkbox => {
        checkbox.addEventListener("change", checkFormValidity);
    });

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        requiredFields.forEach(field => {
            touchedFields.add(field.id);
            validateField(field);
        });

        if (!checkFormValidity()) {
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Creating...";
        responseDiv.style.display = "none";

        const isNew = isNewCheckbox.checked;
        const assetsToCreate = {};

        document
            .querySelectorAll('input[name="assetsToCreate"]')
            .forEach((checkbox) => {
                assetsToCreate[checkbox.value] = checkbox.checked;
            });

        const payload = {
            isNew: isNew,
            packetName: document.getElementById("packetName").value,
            batchNum: document.getElementById("batchNum").value,
            variable: document.getElementById("variable").value,
            parentCreative: document.getElementById("parentCreative").value,
            context: document.getElementById("context").value,
            assetsToCreate: assetsToCreate,
        };

        if (isNew) {
            payload.parentFolderId = document.getElementById("destinationFolderId").value;
            payload.packetName = document.getElementById("packetName").value;
        } else {
            payload.parentFolderId = document.getElementById("parentPacketId").value;
        }

        try {
            const response = await fetch("http://localhost:3030/api/create-folder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            responseDiv.className = "response " + (response.ok ? "success" : "error");
            responseDiv.textContent = response.ok
                ? `Success! Response: ${JSON.stringify(result, null, 2)}`
                : `Error ${response.status}: ${result}`;
            responseDiv.style.display = "block";
        } catch (error) {
            responseDiv.className = "response error";
            responseDiv.textContent = `Network Error: ${error.message}`;
            responseDiv.style.display = "block";
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Create Packet";
            checkFormValidity();
        }
    });
});