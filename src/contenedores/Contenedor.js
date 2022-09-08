const { promises: fs } = require('fs');


class Contenedor {
    constructor(ruta) {
        this.ruta = ruta
    }


    async save(obj) {
        try {
            let isInProds = await fs.readFile(this.ruta, 'utf-8'); 

            if (isInProds.length == 0) { 
                obj.id = 1; 
                const arrayObj = [obj]; 
                const objeto = JSON.stringify(arrayObj); 

                await fs.appendFile(this.ruta, objeto); 
            }
            else { 
                const prodsObj = JSON.parse(isInProds); 
                let arrayLength = prodsObj.length; 
                obj.id = arrayLength + 1;
                prodsObj.push(obj);
                const objeto = JSON.stringify(prodsObj);
                await fs.writeFile(this.ruta, objeto); 
            }
            return obj;
        }
        catch (error) {
            console.log(error)
        }
    }

    async getbyId(id) {
        const products = await this.getAll(); 
        const productbyId = products.find(prod => prod.id == id); 
        return productbyId; 
    }
    async getAll() {
        try {
            const products = await fs.readFile(this.ruta, 'utf8');
            return JSON.parse(products); 
        } catch (error) {
            console.log(error, 'Error lectura')
            return [];
        }
    }
    async deleteById(id) {
        const products = await this.getAll();
        const newProducts = products.filter(prod => prod.id !== id); 
        newProducts.forEach(prod => { 
            if (prod.id > id) { 
                prod.id -- 
            } 
        });
        await fs.writeFile(this.ruta, JSON.stringify(newProducts)); 
        return(newProducts);
    }

    async deleteAll() {
        const arrayVacio = []
        await fs.writeFile(this.ruta, arrayVacio); 
    }



async saveProduct(arr){
    try {
        await fs.writeFile(this.ruta, JSON.stringify(arr, null, 2))
        console.log("guardado exitoso");
    } catch (error) {
        console.error("error de escritura");
        console.error(error)
    }
}
}

module.exports = Contenedor 