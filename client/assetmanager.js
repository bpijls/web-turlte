class AssetManager {
    constructor() {
      this.images = new Map();
    }
  
    loadAllImages() {
      let imageNames = ["turtle@X4N4.png"];
      for (let name of imageNames) {
        this.images.set(name, loadImage("../assets/" + name));
      }
    }
  
    get(imageName) {
      return this.images.get(imageName);
    }
  }