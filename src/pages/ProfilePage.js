import React from "react";
// prettier-ignore
import { Table, Button, Notification, MessageBox, Message, Tabs, Icon, Form, Dialog, Input, Card, Tag } from 'element-react'
import { Auth, API, grapqqlOperation } from "aws-amplify";
import { convertCentsToDollars } from "../utils/index";
const getUser = `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    username
    email
    registered
    orders(sortDirection: DESC, limit: 10) {
      items {
        id
        createdAt
        product{
          id
          owner
          price
          createdAt
          description
        }
        shippingAddress{
          city
          country
          address_line1
          address_state
          address_zip
        }
      }
      nextToken
    }
  }
}
`;

class ProfilePage extends React.Component {
  state = {
    email: this.props.userAttributes && this.props.userAttributes.email,
    emailDialog: false,
    verfiicationCode: "",
    verificationForm: false,
    orders: [],
    columns: [
      { prop: "name", width: "150" },
      { prop: "value", width: "330" },
      {
        prop: "tag",
        width: "150",
        render: row => {
          if (row.name === "Email") {
            const emailVerified = this.props.userAttributes.email_verified;
            return emailVerified ? (
              <Tag type="success">Verified</Tag>
            ) : (
              <Tag type="danger">Unverified</Tag>
            );
          }
        }
      },
      {
        prop: "operations",
        render: row => {
          switch (row.name) {
            case "Email":
              return (
                <Button
                  type="info"
                  size="small"
                  onClick={() => this.setState({ emailDialog: true })}
                >
                  Edit
                </Button>
              );
            case "Delete":
              return (
                <Button type="danger" size="small">
                  Delete
                </Button>
              );
            default:
              return;
          }
        }
      }
    ]
  };

  componentDidMount() {
    if (this.props.userAttributes) {
      console.log(this.props.userAttributes.sub);
      this.getUserOrders(this.props.user.attributes.sub);
    }
  }

  getUserOrders = async userId => {
    const input = { id: userId };
    const result = await API.graphql(grapqqlOperation(getUser, input));
    this.setState({ orders: result.data.getUser.orders.items });
  };

  handleVerfiyEmail = async attr => {
    try {
      const result = await Auth.verifyCurrentUserAttributeSubmit(
        attr,
        this.state.verfiicationCode
      );
      Notification({
        title: "Success",
        message: "Email successfully verified",
        type: `${result.toLowerCase()}`
      });
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.log(err);
      Notification.error({
        title: "Error",
        message: `${err.message}|| "Error updating Email"`
      });
    }
  };
  handleUpdateEmail = async () => {
    try {
      const updatedAttributes = {
        email: this.state.email
      };
      const result = await Auth.updateUserAttributes(
        this.props.user,
        updatedAttributes
      );
      if (result === "SUCCESS") {
        this.sendVerficationCode("email");
      }
    } catch (err) {
      console.error(err);
      Notification.error({
        title: "Error",
        message: `${err.message} || "Error updating email"`
      });
    }
  };

  sendVerficationCode = async attr => {
    await Auth.verifyCurrentUserAttribute(attr);
    this.setState({ verificationForm: true });
    Message({
      type: "info",
      customClass: "message",
      message: `Verification code sent to ${this.state.email}`
    });
  };

  render() {
    const {
      orders,
      columns,
      email,
      emailDialog,
      verfiicationCode,
      verificationForm
    } = this.state;
    const { user, userAttributes } = this.props;
    console.log({ orders });
    return (
      userAttributes && (
        <>
          <Tabs activeName="1" className="profile-tabs">
            <Tabs.Pane
              name="1"
              label={
                <>
                  <Icon name="document" className="icon" />
                  Summary
                </>
              }
            >
              <h2 className="header">Profile Summary</h2>
              <Table
                columns={columns}
                data={[
                  { name: "Your Id", value: userAttributes.sub },
                  { name: "Username", value: user.username },
                  { name: "Email", value: userAttributes.email },
                  { name: "Phone Number", value: userAttributes.phone_number },
                  { name: "Delete Profile", value: "Sorry to see you go" }
                ]}
                showHeader={false}
                rowClassName={row =>
                  row.name === "Delete Profile" && "delete-profile"
                }
              />
            </Tabs.Pane>
            <Tabs.Pane
              label={
                <>
                  <Icon name="message" className="icon">
                    Orders
                  </Icon>
                </>
              }
              name="2"
            >
              <h2 className="header">Order History</h2>
              {orders.length > 0 &&
                orders.map(order => (
                  <div className="mb-1" key={order.id}>
                    <Card>
                      <pre>
                        <p>Order Id:{order.id}</p>
                        <p>Product description: {order.product.description}</p>
                        <p>
                          Price: ${convertCentsToDollars(order.product.price)}
                        </p>
                        <p>Purchased on {order.createdAt}</p>
                        {order.shippingAddress && (
                          <>
                            Shipping Address
                            <div className="ml-2">
                              <p>{order.shippingAddress.address_line1}</p>
                              <p>
                                {order.shippingAddress.city},
                                {order.shippingAddress.address_state}{" "}
                                {order.shippingAddress.country}
                                {order.shippingAddress.address_zip}
                              </p>
                            </div>
                          </>
                        )}
                      </pre>
                    </Card>
                  </div>
                ))}
            </Tabs.Pane>
          </Tabs>

          <Dialog
            size="large"
            customClass="dialog"
            title="Edit Email"
            visible={emailDialog}
            onCancel={() => this.setState({ emailDialog: false })}
          >
            <Dialog.Body>
              <Form labelPosition="top">
                <Form.Item label="Email">
                  <Input
                    value={email}
                    onChange={email => this.setState(email)}
                  />
                </Form.Item>
                {verificationForm && (
                  <Form.Item label="Enter Verfiication Code" labelWidth="120">
                    <Input
                      onChange={verfiicationCode =>
                        this.setState({ verfiicationCode })
                      }
                      value={verfiicationCode}
                    />
                  </Form.Item>
                )}
              </Form>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={() => this.setState({ emailDialog: false })}>
                Cancel
              </Button>
              {!verificationForm && (
                <Button type="primary" onClick={this.handleUpdateEmail}>
                  Save
                </Button>
              )}
              {verificationForm && (
                <Button
                  type="primary"
                  onClick={() => this.handleVerfiyEmail("email")}
                >
                  Submit
                </Button>
              )}
            </Dialog.Footer>
          </Dialog>
        </>
      )
    );
  }
}

export default ProfilePage;
