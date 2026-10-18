/* Hand-drawn material artwork for the reference katana, generated locally. */
window.KazeyamiKatanaFinish = (() => {
  function lacquer(ctx, w, h, mask = false) {
    ctx.fillStyle = mask ? "#050505" : "#080a0c";
    ctx.fillRect(0, 0, w, h);
    const gold = mask ? "#fff" : "#c5a457";
    const dark = mask ? "#050505" : "#13110c";
    // A gold dragon on each broad face; the UV seam stays on the narrow edge.
    for (const middle of [h * 0.25, h * 0.75]) {
      ctx.save();
      ctx.translate(0, middle);
      ctx.scale(w / 2048, h / 512);
      const body = (t) => ({
        x: 350 + t * 1200,
        y: Math.sin(t * Math.PI * 2.6) * 43,
      });
      // Cloud-shaped gold fields surround the dark, engraved dragon.
      ctx.fillStyle = gold;
      for (const [x, y, rotation] of [
        [480, -58, -0.3],
        [770, 64, 0.2],
        [1030, -59, 0.3],
        [1320, 62, -0.2],
      ]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(-105, 18);
        ctx.bezierCurveTo(-136, -14, -50, -13, -62, -41);
        ctx.bezierCurveTo(-14, -60, 12, -24, 37, -37);
        ctx.bezierCurveTo(69, -60, 91, -6, 119, 5);
        ctx.bezierCurveTo(85, 45, 37, 32, 8, 46);
        ctx.bezierCurveTo(-20, 16, -79, 54, -105, 18);
        ctx.fill();
        ctx.strokeStyle = dark;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-85, 15);
        ctx.bezierCurveTo(-15, 5, -47, -25, -13, -20);
        ctx.bezierCurveTo(20, -17, -6, 19, 50, 13);
        ctx.stroke();
        ctx.restore();
      }
      const strokeBody = (color, width) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let i = 0; i <= 160; i++) {
          const p = body(i / 160);
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
        }
        ctx.stroke();
      };
      strokeBody(gold, 46);
      strokeBody(dark, 34);
      // Overlapping scale arcs follow the body instead of a repeated flat grid.
      for (let i = 4; i < 89; i++) {
        const t = i / 90,
          p = body(t);
        const angle = Math.atan2(
          Math.cos(t * Math.PI * 2.6) * 43 * Math.PI * 2.6,
          1200,
        );
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.strokeStyle = gold;
        ctx.lineWidth = 1.8;
        for (let row = -2; row <= 2; row++) {
          ctx.beginPath();
          ctx.arc((row % 2) * 4, row * 6, 5.5, -1.15, 1.15);
          ctx.stroke();
        }
        if (i % 2 === 0) {
          ctx.fillStyle = gold;
          ctx.beginPath();
          ctx.moveTo(-5, -23);
          ctx.lineTo(0, -35);
          ctx.lineTo(5, -23);
          ctx.fill();
        }
        ctx.restore();
      }
      // Four jointed legs end in small claws.
      for (const [t, side] of [
        [0.35, -1],
        [0.44, 1],
        [0.72, -1],
        [0.8, 1],
      ]) {
        const p = body(t);
        ctx.strokeStyle = gold;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.bezierCurveTo(
          p.x - 35,
          p.y + side * 25,
          p.x + 45,
          p.y + side * 39,
          p.x + 14,
          p.y + side * 64,
        );
        ctx.stroke();
        for (let claw = -1; claw <= 1; claw++) {
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(p.x + 14, p.y + side * 60);
          ctx.quadraticCurveTo(
            p.x + 14 + claw * 14,
            p.y + side * 83,
            p.x + 33 + claw * 14,
            p.y + side * 73,
          );
          ctx.stroke();
        }
      }
      const head = body(1);
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(-0.3);
      ctx.fillStyle = gold;
      ctx.beginPath();
      ctx.moveTo(-25, -16);
      ctx.bezierCurveTo(-11, -42, 31, -37, 42, -12);
      ctx.lineTo(83, -8);
      ctx.lineTo(92, 5);
      ctx.lineTo(52, 17);
      ctx.lineTo(80, 29);
      ctx.lineTo(38, 30);
      ctx.bezierCurveTo(14, 48, -8, 20, -25, 16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(29, -9, 8, 4, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(54, 8, 27, 4);
      ctx.strokeStyle = gold;
      ctx.lineWidth = 5;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(3, -22);
        ctx.bezierCurveTo(-17, -56, 26, -58, 21 + side * 20, -86);
        ctx.stroke();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 14);
        ctx.bezierCurveTo(125, 0, 115, side * 59, 165, side * 30);
        ctx.stroke();
      }
      ctx.restore();
      ctx.restore();
    }
    if (!mask) {
      ctx.fillStyle = "#ffffff08";
      for (let i = 0; i < 9000; i++)
        ctx.fillRect((i * 73.137) % w, (i * 59.273) % h, 0.8, 0.8);
    }
  }
  function rayskin(ctx, w, h) {
    ctx.fillStyle = "#ccc4ad";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 5)
      for (let x = 0; x < w; x += 5) {
        ctx.fillStyle = (x + y) % 3 ? "#ddd5c0" : "#b6ac92";
        ctx.beginPath();
        ctx.ellipse(x + (y % 10 ? 2.5 : 0), y, 1.8, 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
  }
  function cloth(ctx, w, h) {
    ctx.fillStyle = "#121515";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3)
      for (let x = 0; x < w; x += 3) {
        ctx.strokeStyle = (x + y) % 2 ? "#2e3230" : "#090b0b";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x + 3, y);
        ctx.stroke();
      }
  }
  function cord(ctx, w, h) {
    // Neutral woven cotton is tinted crimson by the ribbon material.
    ctx.fillStyle = "#b9b9b9";
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3)
      for (let x = 0; x < w; x += 3) {
        ctx.strokeStyle = (x + y) % 2 ? "#cdcdcd" : "#9e9e9e";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y + 2);
        ctx.stroke();
      }
    ctx.fillStyle = "#d0d0d0";
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, h - 2, w, 2);
  }
  function guard(ctx, w, h, mask = false) {
    ctx.fillStyle = mask ? "#1a1a1a" : "#29251d";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(w / 512, h / 512);
    ctx.fillStyle = mask ? "#d9d9d9" : "#b19653";
    ctx.beginPath();
    ctx.arc(22, -12, 100, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = mask ? "#fff" : "#c7a65b";
    ctx.lineWidth = 5;
    // Bamboo stalks and leaves echo the antique landscape on the reference guard.
    for (const [base, lean] of [
      [-150, 0.28],
      [-110, -0.22],
      [155, -0.33],
    ]) {
      ctx.save();
      ctx.translate(base, 190);
      ctx.rotate(lean);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-25, -190, 0, -365);
      ctx.stroke();
      for (let j = 1; j < 6; j++) {
        const y = -j * 57;
        ctx.fillRect(-8, y, 15, 3);
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * 30, y - 22, 36, 7, side * -0.65, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
    ctx.strokeStyle = mask ? "#777" : "#70592d";
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(30, 155 + i * 8, 155 + i * 6, 28, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = mask ? "#222" : "#322a1c";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-15, -24);
    ctx.quadraticCurveTo(10, -60, 27, -18);
    ctx.quadraticCurveTo(50, -58, 72, -30);
    ctx.stroke();
    ctx.restore();
  }
  return { lacquer, rayskin, cloth, cord, guard };
})();
