import React from "react";
import { Loading, Tabs, Icon } from "element-react";
import { API, graphqlOperation } from "aws-amplify";
// import { getMarket } from "../graphql/queries";
import {
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct
} from "../graphql/subscriptions";
import { Link } from "react-router-dom";
import NewProduct from "../components/NewProduct";
import Product from "../components/Product";
import { deleteProduct } from "../graphql/mutations";

export const getMarket = `query GetMarket($id: ID!) {
  getMarket(id: $id) {
    id
    name
    products {
      items {
        id
        description
        price
        shipped
        owner
        file{
          key
        }
        createdAt
      }
      nextToken
    }
    tags
    owner
    createdAt
  }
}
`;

class MarketPage extends React.Component {
  state = {
    market: null,
    isLoading: true,
    isMarketOwner: false
  };

  componentDidMount() {
    this.handleGetMarket();

    this.createProductListener = API.graphql(
      graphqlOperation(onCreateProduct)
    ).subscribe({
      next: productData => {
        const createdProduct = productData.value.data.onCreateProduct;
        const prevProducts = this.state.market.products.items.filter(
          item => item.id !== createdProduct.id
        );
        const updatedProducts = [createdProduct, ...prevProducts];
        const market = { ...this.state.market };
        market.products.items = updatedProducts;
        this.setState({ market });
      }
    });
    this.updateProductListener = API.graphql(
      graphqlOperation(onUpdateProduct)
    ).subscribe({
      next: productData => {
        const updateProduct = productData.value.data.onUpdateProduct;
        const updatedProductIndex = this.state.market.products.items.findIndex(
          item => item.id === updateProduct.id
        );
        const updatedProducts = [
          ...this.state.market.products.items.slice(0, updatedProductIndex),
          updateProduct,
          ...this.state.market.products.items.slice(updatedProductIndex + 1)
        ];

        const market = { ...this.state.market };
        market.products.items = updatedProducts;
        this.setState({ market });
      }
    });
    this.deleteProductListener = API.graphql(
      graphqlOperation(onDeleteProduct)
    ).subscribe({
      next: productData => {
        const deletedProduct = productData.value.data.onCreateProduct;
        const updatedProducts = this.state.market.products.items.filter(
          item => item.id !== deletedProduct.id
        );
        const market = { ...this.state.market };
        market.products.items = updatedProducts;
        this.setState({ market });
      }
    });
  }

  componentWillUnmount() {
    this.createProductListener.unsubscribe();
    this.updateProductListener.unsubscribe();
    this.deleteProductListener.unsubscribe();
  }

  handleGetMarket = async () => {
    const input = {
      id: this.props.marketId
    };
    const result = await API.graphql(graphqlOperation(getMarket, input));
    console.log({ result });
    this.setState({ market: result.data.getMarket, isLoading: false }, () => {
      this.checkMarketOwner();
    });
  };

  checkMarketOwner = () => {
    console.log("checkMarketOwner is called");
    const { user } = this.props;
    const { market } = this.state;
    if (user) {
      console.log("user.uesrname" + user.username);
      console.log("market.owner" + market.owner);
      this.setState({ isMarketOwner: user.username === market.owner });
    }
  };

  render() {
    const { market, isLoading, isMarketOwner } = this.state;
    return isLoading ? (
      <Loading fullscreen={true} />
    ) : (
      <>
        <Link className="link" to="/">
          Back to Markets List
        </Link>
        <span className="item-center pt-2">
          <h2 className="mb-mr">{market.name}</h2>- {market.owner}
        </span>
        <div className="item-center pt-2">
          <span style={{ color: "var(--lightSquidInk)", paddingBottom: "1em" }}>
            <Icon name="date" className="icon" />
            {market.createdAt}
          </span>
        </div>
        <Tabs type="border-card" value={isMarketOwner ? "1" : "2"}>
          {isMarketOwner && (
            <Tabs.Pane
              label={
                <>
                  <Icon name="plus" className="icon" />
                  Add Product
                </>
              }
              name="1"
            >
              <NewProduct marketId={this.props.marketId} />
            </Tabs.Pane>
          )}

          <Tabs.Pane
            label={
              <>
                <Icon name="menu" className="icon" />
                Products ({market.products.items.length})
              </>
            }
            name="2"
          >
            <div className="product-list">
              {market.products.items.map(product => (
                <Product key={product.id} product={product} />
              ))}
            </div>
          </Tabs.Pane>
        </Tabs>
      </>
    );
  }
}

export default MarketPage;
