import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";


const imgboxs = document.querySelectorAll(".article-content img");
imgboxs.forEach((img) => {
    img.setAttribute("data-fancybox", "gallery");
})

Fancybox.bind("[data-fancybox]", {
    hideScrollbar: true,
})