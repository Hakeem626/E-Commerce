const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', (req, res) => {
  Product.findAll({
    include: [
      Category,
      {
      model: Tag,
      through: ProductTag
    }]
  })
  .then((model) => res.json(model))
    .catch((err) => res.json(err));
  // find all products
  // be sure to include its associated Category and Tag data
});

// get one product
router.get('/:id', (req, res) => {
  // find a single product by its `id`
  // be sure to include its associated Category and Tag data
});

// create new product
router.post('/', (req, res) => {
  /* req.body should look like this...
    {
      product_name: "Basketball",
      price: 200.00,
      stock: 3,
      tagIds: [1, 2, 3, 4]
    }
  */
  Product.create(req.body)
    .then((product) => {
      // if there's product tags, we need to create pairings to bulk create in the ProductTag model
      if (req.body.tagIds.length) {
        const productTagIdArr = req.body.tagIds.map((tag_id) => {
          return {
            product_id: product.id,
            tag_id,
          };
        });
        return ProductTag.bulkCreate(productTagIdArr);
      }
      // if no product tags, just respond
      res.status(200).json(product);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

// update product
router.put('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    // Check if the product exists
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update the product data
    await Product.update(req.body, {
      where: {
        id: productId,
      },
    });

    // Update the associated tags
    const existingProductTags = await ProductTag.findAll({
      where: { product_id: productId },
    });

    const existingTagIds = existingProductTags.map(({ tag_id }) => tag_id);
    const newTagIds = req.body.tagIds;

    // Remove tags that are no longer associated
    const tagsToRemove = existingProductTags
      .filter(({ tag_id }) => !newTagIds.includes(tag_id))
      .map(({ id }) => id);

    await ProductTag.destroy({ where: { id: tagsToRemove } });

    // Add new tags
    const tagsToAdd = newTagIds
      .filter((tag_id) => !existingTagIds.includes(tag_id))
      .map((tag_id) => {
        return {
          product_id: productId,
          tag_id,
        };
      });

    await ProductTag.bulkCreate(tagsToAdd);

    // Fetch the updated product data
    const updatedProduct = await Product.findByPk(productId, {
      include: [{ model: Tag, through: ProductTag }],
    });

    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.delete('/:id', (req, res) => {
  // delete one product by its `id` value
  Product.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((deletedProduct) => {
      if (!deletedProduct) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      // If the product was deleted successfully, you can send a success message.
      res.status(200).json({ message: 'Product deleted successfully' });
    })
    .catch((err) => {
      // Handle any errors that occur during the deletion process.
      res.status(500).json(err);
    });
});


module.exports = router;
