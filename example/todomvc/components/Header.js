import React, { Component } from 'react'
import PropTypes from 'proptypes'
import TodoTextInput from './TodoTextInput'

class Header extends Component {
  handleSave(text) {
    if (text.length !== 0) {
      this.props.addTodo(text)
    }
  }

  render() {
    return (
      <header className="header">
        <h1>Redux todomvc example</h1>
        <TodoTextInput
          newTodo
          onSave={this.handleSave.bind(this)}
          placeholder="What needs to be done?"
        />
      </header>
    )
  }
}

Header.propTypes = {
  addTodo: PropTypes.func.isRequired
}

export default Header
