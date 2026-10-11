
"use strict";

// =====================================
// 1. قراءة العقارات من LocalStorage
// =====================================
function getProperties() {
    try {
        const data = JSON.parse(
            localStorage.getItem("properties") || "[]"
        );

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("تعذر قراءة العقارات:", error);
        return [];
    }
}

// =====================================
// 2. حفظ العقارات
// =====================================
function saveProperties(list) {
    localStorage.setItem("properties", JSON.stringify(list));
}

// =====================================
// 3. إضافة عقار جديد
// =====================================
function addProperty() {
    const type = document.getElementById("type").value.trim();
    const owner = document.getElementById("owner").value.trim();
    const location = document.getElementById("location").value.trim();
    const priceInput = document.getElementById("price").value;
    const price = Number(priceInput);
    const desc = document.getElementById("desc").value.trim();
    const operation = document.getElementById("operation").value;
    const imageFile = document.getElementById("image").files[0];

    if (
        !type ||
        !owner ||
        !location ||
        priceInput.trim() === "" ||
        !desc ||
        !imageFile
    ) {
        alert("الرجاء تعبئة جميع الحقول واختيار صورة.");
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        alert("يرجى إدخال سعر أكبر من صفر.");
        return;
    }

    if (!["buy", "rent"].includes(operation)) {
        alert("نوع العملية غير صالح.");
        return;
    }

    if (!imageFile.type.startsWith("image/")) {
        alert("يرجى اختيار ملف صورة صالح.");
        return;
    }

    // حد تجريبي لحجم الصورة: 2 ميغابايت
    if (imageFile.size > 2 * 1024 * 1024) {
        alert("حجم الصورة كبير. اختر صورة لا تتجاوز 2 ميغابايت.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const list = getProperties();

            list.push({
                id: Date.now().toString(),
                type,
                owner,
                location,
                price,
                desc,
                image: event.target.result,
                operation
            });

            saveProperties(list);

            alert("تمت إضافة العقار بنجاح.");

            document.getElementById("type").value = "";
            document.getElementById("owner").value = "";
            document.getElementById("location").value = "";
            document.getElementById("price").value = "";
            document.getElementById("desc").value = "";
            document.getElementById("operation").value = "buy";
            document.getElementById("image").value = "";
        } catch (error) {
            console.error("تعذر حفظ العقار:", error);
            alert("تعذر حفظ العقار. قد تكون مساحة التخزين ممتلئة.");
        }
    };

    reader.onerror = function () {
        alert("تعذرت قراءة الصورة. حاول اختيار صورة أخرى.");
    };

    reader.readAsDataURL(imageFile);
}

// =====================================
// 4. إنشاء بطاقة عقار بطريقة آمنة
// =====================================
function createPropertyCard(property) {
    const card = document.createElement("article");
    card.className = "card";

    const image = document.createElement("img");
    image.alt = property.type
        ? `صورة ${property.type}`
        : "صورة العقار";
    image.loading = "lazy";

    // السماح بصورة Base64 أو رابط صورة HTTP(S)
    const imageUrl = property.image || "";

    if (
        imageUrl.startsWith("data:image/") ||
        /^https?:\/\//i.test(imageUrl)
    ) {
        image.src = imageUrl;
    }

    const content = document.createElement("div");
    content.className = "card-content";

    const title = document.createElement("h3");
    title.textContent = property.type || "عقار";

    const description = document.createElement("p");
    description.textContent = property.desc || "";

    const location = document.createElement("p");
    const locationLabel = document.createElement("strong");
    locationLabel.textContent = "الموقع: ";
    location.append(locationLabel, document.createTextNode(
        property.location || "غير محدد"
    ));

    const owner = document.createElement("p");
    const ownerLabel = document.createElement("strong");
    ownerLabel.textContent = "المالك: ";
    owner.append(ownerLabel, document.createTextNode(
        property.owner || "غير محدد"
    ));

    const price = document.createElement("div");
    price.className = "price";
    price.textContent =
        `${Number(property.price).toLocaleString("ar")} $`;

    content.append(title, description, location, owner, price);
    card.append(image, content);

    return card;
}

// =====================================
// 5. البحث والتصفية وترتيب الأسعار
// =====================================
function displayProperties(operation) {
    const container = document.getElementById(
        operation === "buy" ? "buyList" : "rentList"
    );

    if (!container) return;

    const searchInput = document.getElementById("searchLocation");
    const typeSelect = document.getElementById("filterType");
    const minInput = document.getElementById("minPrice");
    const maxInput = document.getElementById("maxPrice");
    const sortSelect = document.getElementById("sortPrice");
    const resultsCount = document.getElementById("resultsCount");

    const search = searchInput.value.trim().toLocaleLowerCase();
    const selectedType = typeSelect.value;
    const minPrice = minInput.value === ""
        ? null
        : Number(minInput.value);
    const maxPrice = maxInput.value === ""
        ? null
        : Number(maxInput.value);

    const list = getProperties()
        .filter(property => property.operation === operation)
        .filter(property => {
            const location = String(property.location || "")
                .toLocaleLowerCase();

            const matchesLocation = location.includes(search);
            const matchesType =
                !selectedType || property.type === selectedType;

            const price = Number(property.price);
            const matchesMin =
                minPrice === null || price >= minPrice;
            const matchesMax =
                maxPrice === null || price <= maxPrice;

            return (
                matchesLocation &&
                matchesType &&
                matchesMin &&
                matchesMax
            );
        });

    // ترتيب نسخة النتائج دون تغيير البيانات الأصلية
    if (sortSelect.value === "asc") {
        list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortSelect.value === "desc") {
        list.sort((a, b) => Number(b.price) - Number(a.price));
    }

    container.replaceChildren();

    if (resultsCount) {
        resultsCount.textContent =
            `عدد العقارات المطابقة: ${list.length}`;
    }

    if (list.length === 0) {
        const message = document.createElement("p");
        message.className = "empty-results";
        message.textContent =
            "لا توجد عقارات مطابقة. جرّب تغيير خيارات البحث.";
        container.appendChild(message);
        return;
    }

    const fragment = document.createDocumentFragment();

    list.forEach(property => {
        fragment.appendChild(createPropertyCard(property));
    });

    container.appendChild(fragment);
}

// =====================================
// 6. تشغيل الصفحة وربط أدوات البحث
// =====================================
document.addEventListener("DOMContentLoaded", function () {
    const buyPage = document.getElementById("buyList");
    const rentPage = document.getElementById("rentList");

    const operation = buyPage
        ? "buy"
        : rentPage
            ? "rent"
            : null;

    if (!operation) return;

    const filterIds = [
        "searchLocation",
        "filterType",
        "minPrice",
        "maxPrice",
        "sortPrice"
    ];

    filterIds.forEach(id => {
        const element = document.getElementById(id);

        if (element) {
            element.addEventListener("input", function () {
                displayProperties(operation);
            });

            element.addEventListener("change", function () {
                displayProperties(operation);
            });
        }
    });

    const resetButton = document.getElementById("resetFilters");

    if (resetButton) {
        resetButton.addEventListener("click", function () {
            document.getElementById("searchLocation").value = "";
            document.getElementById("filterType").value = "";
            document.getElementById("minPrice").value = "";
            document.getElementById("maxPrice").value = "";
            document.getElementById("sortPrice").value = "default";

            displayProperties(operation);
        });
    }

    displayProperties(operation);
});
