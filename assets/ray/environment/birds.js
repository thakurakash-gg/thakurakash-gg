/* Shared gull geometry: curved feathered wings, body, tail, head and beak. */
(() => {
  const THREE = window.THREE;
  const Prototype = window.RayWorld.prototype;
  Prototype.createBirds = function () {
    const white = new THREE.MeshStandardMaterial({ color: 0xe4e4dc, roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4c555a, roughness: 0.8 });
    const beak = new THREE.MeshStandardMaterial({ color: 0xc6a264, roughness: 0.6 });
    const wingMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.82,
    });
    const position = [],
      color = [];
    const sections = [
      [0, 0.08, -0.22],
      [0.35, 0.18, -0.3],
      [0.85, 0.16, -0.2],
      [1.24, 0.04, 0.02],
    ];
    for (let section = 0; section < sections.length - 1; section++) {
      const [x, front, back] = sections[section],
        [nextX, nextFront, nextBack] = sections[section + 1];
      const points = [
        [x, Math.sin(x * 2) * 0.1, front],
        [x, Math.sin(x * 2) * 0.1, back],
        [nextX, Math.sin(nextX * 2) * 0.1, nextFront],
        [nextX, Math.sin(nextX * 2) * 0.1, nextBack],
      ];
      for (const index of [0, 1, 2, 2, 1, 3]) {
        position.push(...points[index]);
        const shade = section === 2 ? 0.32 : 0.82;
        color.push(shade, shade + 0.025, shade + 0.04);
      }
    }
    for (let feather = 0; feather < 9; feather++) {
      const x = 0.38 + feather * 0.09,
        z = -0.28 + feather * 0.018;
      for (const point of [
        [x, 0.08, z],
        [x + 0.11, 0.07, z + 0.04],
        [x + 0.03, 0.05, z - 0.14],
      ]) {
        position.push(...point);
        color.push(0.62, 0.65, 0.66);
      }
    }
    const wing = new THREE.BufferGeometry();
    wing.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
    wing.setAttribute("color", new THREE.Float32BufferAttribute(color, 3));
    wing.computeVertexNormals();
    const sphere = new THREE.SphereGeometry(1, 10, 7);
    const cone = new THREE.ConeGeometry(1, 1, 8);
    const part = (group, geometry, material, scale, point) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(...scale);
      mesh.position.set(...point);
      group.add(mesh);
      return mesh;
    };
    for (let index = 0; index < 7; index++) {
      const group = new THREE.Group();
      part(group, sphere, white, [0.17, 0.15, 0.39], [0, 0, 0]);
      part(group, sphere, white, [0.125, 0.13, 0.16], [0, 0.13, 0.31]);
      const bill = part(group, cone, beak, [0.055, 0.2, 0.05], [0, 0.12, 0.51]);
      bill.rotation.x = Math.PI / 2;
      for (const side of [-1, 1])
        part(group, sphere, dark, [0.018, 0.018, 0.018], [side * 0.114, 0.16, 0.36]);
      const tail = part(group, cone, white, [0.18, 0.3, 0.04], [0, -0.01, -0.43]);
      tail.rotation.x = -Math.PI / 2;
      const left = part(group, wing, wingMaterial, [1, 1, 1], [0.1, 0.07, 0.02]);
      const right = part(group, wing, wingMaterial, [-1, 1, 1], [-0.1, 0.07, 0.02]);
      this.scene.add(group);
      this.birds.push({ g: group, left, right, offset: index * 0.6 });
    }
    this.canvas.dataset.birds = "feathered-gulls";
  };
})();
