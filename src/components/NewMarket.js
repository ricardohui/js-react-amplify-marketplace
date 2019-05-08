import React from "react";
// prettier-ignore
import {API,graphqlOperation} from 'aws-amplify'
import { createMarket } from "../graphql/mutations";
import {
  Form,
  Button,
  Dialog,
  Input,
  Select,
  Notification
} from "element-react";
import { UserContext } from "../App";
class NewMarket extends React.Component {
  state = {
    name: "",
    options: [],
    tags: ["Arts", "Web Dev", "Technology", "Crafts", "Entertainment"],
    addMarketDialog: false,
    selectedTags: []
  };

  handleAddMarket = async user => {
    try {
      console.log(this.state.name);
      this.setState({ addMarketDialog: false });
      const input = {
        name: this.state.name,
        tags: this.state.selectedTags,
        owner: user.username
      };
      const result = await API.graphql(
        graphqlOperation(createMarket, { input })
      );
      console.log({ result });
      console.info(`Created market: id ${result.data.createMarket.id}`);
      this.setState({ name: "" });
    } catch (error) {
      console.error("Error adding new market", error);
      Notification.error({
        title: "Error",
        message: `${error.message || "Error adding market"}`
      });
    }
  };

  handleFilterTags = query => {
    const options = this.state.tags
      .map(tag => ({ value: tag, label: tag }))
      .filter(tag =>
        tag.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      );
    this.setState({ options });
  };
  render() {
    return (
      <UserContext.Consumer>
        {({ user }) => (
          <>
            <div className="market-header">
              <h1 className="market-title">
                Create Your Marketplace
                <Button
                  type="text"
                  icon="edit"
                  className="market-title-button"
                  onClick={() => this.setState({ addMarketDialog: true })}
                />
              </h1>

              <Form inline={true} onSubmit={this.props.handleSearch}>
                <Form.Item>
                  <Input
                    placeholder="Search Market..."
                    value={this.props.searchTerm}
                    onIconClick={this.props.handleClearSearch}
                    onChange={this.props.handleSearchChange}
                    icon="circle-cross"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="info"
                    icon="search"
                    onClick={this.props.handleSearch}
                    loading={this.props.isSearching}
                  />
                </Form.Item>
              </Form>
            </div>
            <Dialog
              title="Create New Market"
              visible={this.state.addMarketDialog}
              onCancel={() => this.setState({ addMarketDialog: false })}
              size="large"
              customClass="dialog"
            >
              <Dialog.Body>
                <Form labelPosition="top">
                  <Form.Item label="Add Market Name">
                    <Input
                      placeholder="Market Name"
                      trim={true}
                      onChange={name => this.setState({ name })}
                      value={this.state.name}
                    />
                  </Form.Item>
                  <Form.Item label="Add Tags">
                    <Select
                      multiple={true}
                      filterable={true}
                      placeholder="Market Tags"
                      onChange={selectedTags => this.setState({ selectedTags })}
                      remoteMethod={this.handleFilterTags}
                      remote={true}
                    >
                      {this.state.options.map(options => (
                        <Select.Option
                          key={options.value}
                          label={options.value}
                          value={options.value}
                        />
                      ))}
                    </Select>
                  </Form.Item>
                </Form>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  onClick={() => this.setState({ addMarketDialog: false })}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  disabled={!this.state.name}
                  onClick={() => this.handleAddMarket(user)}
                >
                  Add
                </Button>
              </Dialog.Footer>
            </Dialog>
          </>
        )}
      </UserContext.Consumer>
    );
  }
}

export default NewMarket;
