import { continueRender, delayRender, staticFile } from "remotion";
const handle = delayRender("load Outfit");
Promise.all([
  new FontFace("Outfit", `url(${staticFile("fonts/Outfit-Regular.ttf")})`, { weight: "400" }).load(),
  new FontFace("Outfit", `url(${staticFile("fonts/Outfit-Bold.ttf")})`, { weight: "700" }).load(),
]).then((fs) => { fs.forEach((f) => document.fonts.add(f)); continueRender(handle); }).catch(() => continueRender(handle));
