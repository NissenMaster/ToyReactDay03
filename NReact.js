/**
 * @author nissen
 */

function createElement(type, attributes, ...children) {
  let element = null;
  if (typeof type === 'string') {
    element = new ElementWrapper(type);
  } else {
    element = new type;
  }
  for (let attribute in attributes) {
    element.setAttribute(attribute, attributes[attribute]);
  }

  const insertChildren = (children) => {
    for (let child of children) {
      if (Array.isArray(child)) {
        insertChildren(child);
      } else {
        if (child === null || child === undefined) {
          child = '';
        }
        if (!(child instanceof Component || child instanceof ElementWrapper || child instanceof TextWrapper)) {
          child = child + '';
        }
        if (typeof child === 'string') {
          child = new TextWrapper(child);
        }
        element.appendChild(child);
      }
    }
  };

  insertChildren(children);

  return element;
}

class Component {
  constructor() {
    this.children = [];
    this.props = Object.create(null);
    this.LIFTE_CYCLE_STATE = 'init';
  }

  get type() {
    return this.constructor.name;
  }

  setAttribute(attribute, value) {
    if (attribute.match(/^on([\s\S]+)$/)) {}
    if (attribute === 'className') {
      attribute = 'class';
    }
    this.props[attribute] = value;
    this[attribute] = value;
  }

  get vdom() {
    return this;
  }

  mountTo(range) {
    this.range = range;
    this.update();
  }

  update() {
    let vdom = this.vdom;
    if (this.oldvdom) {
      let isSameNode = (node1, node2) => {
        if (!(node1 && node2)) {
          return false;
        }
        if (node1.type !== node2.type) {
          return false;
        }
        for (let name in node1.props) {
          if (typeof node1.props[name] === 'function' && typeof node2.props[name] === 'function' && String(node1.props[name]) !== String(node2.props[name])) {
            continue;
          }

          if (typeof node1.props[name] === 'object' && typeof node2.props[name] === 'object' && JSON.stringify(node1.props[name]) !== JSON.stringify(node2.props[name])) {
            continue;
          }

          if (node1.props[name] !== node2.props[name]) {
            return false;
          }
        }
        if (Object.keys(node1.props).length !== Object.keys(node2.props).length) {
          return false;
        }
        return true;
      };

      let isSameTree = (node1, node2) => {
        if (!isSameNode(node1, node2)) {
          return false;
        }
        if (node1.children.length !== node2.children.length) {
          return false;
        }
        for (let i = 0; i < node1.children.length; i++) {
          if (!isSameTree(node1.children[i], node2.children[i])) {
            return false;
          }
        }
        return true;
      };

      let replace = (newTree, oldTree) => {
        if (isSameTree(newTree, oldTree)) {
          return;
        }
        if (!isSameNode(newTree, oldTree)) {
          newTree.mountTo(oldTree.range);
        }
        else {
          for (let i = 0; i < newTree.children.length; i++) {
            replace(newTree.children[i], oldTree.children[i]);
          }
        }
      };

      replace(vdom, this.oldvdom, "");
    }
    else {
      vdom.mountTo(this.range);
    }
    this.oldvdom = vdom;
  }

  get vdom() {
    return this.render().vdom;
  }

  appendChild(child) {
    this.children.push(child)
  }

  setState(state) {
    if (typeof state === 'undefined') {
      return void 0;
    }
    const merge = (prevState, nextState) => {
      for (let s in nextState) {
        if (typeof nextState[s] === 'object' && nextState[s] !== null) {
          if (typeof prevState[s] !== 'object') {
            if (nextState[s] instanceof Array) {
              prevState[s] = [];
            }
            else {
              prevState[s] = {};
            }
          }
          merge(prevState[s], nextState[s])
        } else {
          prevState[s] = nextState[s];
        }
      }
      return prevState
    };
    if (!this.state) {
      this.state = {}
    }
    const prevState = JSON.parse(JSON.stringify(this.state));
    const nextState = merge(this.state, state);
    const diff = (prevState, nextState) => {
      return JSON.stringify(prevState) !== JSON.stringify(nextState)
    };
    if (diff(prevState, nextState)) {
      if (this.LIFTE_CYCLE_STATE === 'mounted') {
        // will Update
        if (this.LIFTE_CYCLE_STATE === 'mounted') {
          if (typeof this.willUpdate === 'function') {
            this.willUpdate(prevState, nextState);
          }
        }
      }
      this.update();
      if (this.LIFTE_CYCLE_STATE === 'mounted') {
        console.log('didUpdate');
        // did Update
        if (this.LIFTE_CYCLE_STATE === 'mounted') {
          if (typeof this.didUpdate === 'function') {
            this.didUpdate();
          }
        }
      }
    }
  }

  changeLIFTE_CYCLE_STATE(nextLIFTE_CYCLE_STATE) {
    this.LIFTE_CYCLE_STATE = nextLIFTE_CYCLE_STATE;
  }
}

let childrenSymbol = Symbol('children');

class ElementWrapper {
  constructor(type) {
    this.type = type;
    this.props = Object.create(null);
    this.children = [];
    this[childrenSymbol] = [];
  }

  setAttribute(name, value) {
    this.props[name] = value;
  }

  get children() {
    return this.children.map(child => child.vdom)
  }

  appendChild(vchild) {
    this[childrenSymbol].push(vchild);
  }

  get vdom() {
    return this;
  }

  mountTo(range) {
    this.range = range;
    range.deleteContents();
    let element = document.createElement(this.type);
    for (let name in this.props) {
      let value = this.props[name];

      if (name.match(/^on([\s\S]+)$/)) {
        let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase());
        element.addEventListener(eventName, value);
      }
      if (name === 'className') {
        element.setAttribute('class', value);
      }
      element.setAttribute(name, value);
    }

    for (let child of this.children) {
      const range = document.createRange();
      if (element.children.length) {
        range.setStartAfter(element.lastChild);
        range.setEndAfter(element.lastChild);
      } else {
        range.setStart(element, 0);
        range.setEnd(element, 0);
      }
      child.mountTo(range);
    }
    range.insertNode(element);
  }
}

class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
    this.type = '#text';
    this.children = [];
    this.props = Object.create(null);
  }

  mountTo(range) {
    this.range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }
  get vdom() {
    return this;
  }
}

function render(vdom, root) {
  let range = document.createRange();
  if (root.children.length) {
    range.setStartAfter(root.lastChild);
    range.setEndAfter(root.lastChild);
  } else {
    range.setStart(root, 0);
    range.setEnd(root, 0);
  }
  vdom.mountTo(range);
}

export const NReactDOM = {
  render
};

export const NReact = {
  createElement,
  Component
};