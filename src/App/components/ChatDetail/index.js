import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  ChatContainer,
  Bubble,
  ImgBubble,
  BubbleGroup,
  FromName,
  EmojiBubble,
} from './style';
import * as Autolinker from 'autolinker';
import sanitizeHtml from 'sanitize-html';
import { getUsersFromMessageGroups } from '../../../helpers/stories';
import { onlyContainsEmoji, sortAndGroupBubbles } from '../../../helpers/utils';
import { openGallery } from '../../../actions/gallery';

class ChatView extends Component {
  constructor() {
    super();

    this.state = {
      users: [],
    };
  }

  componentDidMount() {
    if (this.props.messages) {
      this.fetchUsers();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.scrollToBottom();

    if (prevProps !== this.props && this.props.messages) {
      this.fetchUsers();
    }
  }

  openGallery = e => {
    this.props.dispatch(openGallery(e));
  };

  formatMessage(message) {
    if (!message) {
      return '';
    }
    let cleanMessage = sanitizeHtml(message);
    let linkedMessage = Autolinker.link(cleanMessage);
    return linkedMessage;
  }

  fetchUsers = () => {
    getUsersFromMessageGroups(this.props.messages).then(data => {
      this.setUsersData(data);
    });
  };

  setUsersData = data => {
    this.setState({
      users: data,
    });
  };

  render() {
    let { messages } = this.props;
    if (!messages) return <span />;

    const { users } = this.state;

    return (
      <ChatContainer>
        {messages.map((group, i) => {
          const itsaMe = group[0].userId === this.props.user.uid;
          const user = !itsaMe &&
            users &&
            users.find(user => user.uid === group[0].userId);
          return (
            <BubbleGroup key={i} me={itsaMe}>
              <FromName>{user && user.name}</FromName>
              {group.map((message, i) => {
                // mxstbr: The "emoji" specific type is legacy, remove in the future
                if (
                  message.message.type === 'text' ||
                  message.message.type === 'emoji'
                ) {
                  let TextBubble = onlyContainsEmoji(message.message.content)
                    ? EmojiBubble
                    : Bubble;
                  return (
                    <TextBubble
                      key={i}
                      me={itsaMe}
                      dangerouslySetInnerHTML={{
                        __html: this.formatMessage(message.message.content),
                      }}
                    />
                  );
                }

                if (message.message.type === 'media') {
                  return (
                    <ImgBubble
                      me={itsaMe}
                      onClick={this.openGallery}
                      src={message.message.content}
                      key={i}
                    />
                  );
                }

                return null;
              })}
            </BubbleGroup>
          );
        })}

      </ChatContainer>
    );
  }
}

const mapStateToProps = state => {
  const messages = state.messages.messages.filter(
    message => message.storyId === state.stories.active,
  );
  return {
    user: state.user,
    stories: state.stories,
    messages: sortAndGroupBubbles(messages),
  };
};

export default connect(mapStateToProps)(ChatView);