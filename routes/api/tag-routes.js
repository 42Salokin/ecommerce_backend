const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');

// The `/api/tags` endpoint

router.get('/', async (req, res) => {
  // find all tags
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findAll({
      include: [{ model: Product }],
    });
    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  try {
    const tagData = await Tag.findByPk(req.params.id, {
      include: [{ model: Product }],
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
}); 

router.post('/', async (req, res) => {
  try {
    // Create the tag
    const newTag = await Tag.create({
      tag_name: req.body.tag_name,
    });

    // If there are associated product IDs in the request body, create associations in the ProductTag model
    if (req.body.productIds && req.body.productIds.length) {
      const productTagIdArr = req.body.productIds.map((product_id) => {
        return {
          product_id,
          tag_id: newTag.id,
        };
      });

      await ProductTag.bulkCreate(productTagIdArr);
    }

    res.status(200).json(newTag);
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});


// update a tag's name by its `id` value
router.put('/:id', async (req, res) => {
  try {
    // Update tag data
    const updatedTag = await Tag.update(
      { tag_name: req.body.tag_name },
      { where: { id: req.params.id } }
    );

    // If there are associated product IDs in the request body, update associations in the ProductTag model
    if (req.body.productIds && req.body.productIds.length) {
      const productTagIdsToRemove = await ProductTag.findAll({
        where: { tag_id: req.params.id }
      }).then((productTags) => {
        // Create filtered list of current product_ids associated with the tag
        const currentProductTagIds = productTags.map(({ product_id }) => product_id);
        
        // Create filtered list of new product_ids
        const newProductIds = req.body.productIds.filter((product_id) => {
          return !currentProductTagIds.includes(product_id);
        });

        // Create filtered list of product_ids to remove
        const productTagIdsToRemove = productTags
          .filter(({ product_id }) => !req.body.productIds.includes(product_id))
          .map(({ id }) => id);

        // Bulk create new associations and delete removed associations
        return Promise.all([
          ProductTag.bulkCreate(newProductIds.map((product_id) => ({
            product_id,
            tag_id: req.params.id
          }))),
          ProductTag.destroy({ where: { id: productTagIdsToRemove } })
        ]);
      });

      // Respond with the updated tag
      res.status(200).json(updatedTag);
    } else {
      // If no product IDs are provided, only update tag data
      res.status(200).json(updatedTag);
    }
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});



router.delete('/:id', async (req, res) => {
  // delete on tag by its `id` value
  try {
    const tagData = await Tag.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (!tagData) {
      res.status(404).json({ message: 'No tag found with that id!' });
      return;
    }

    res.status(200).json(tagData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
