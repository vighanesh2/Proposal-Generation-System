import React from 'react';
import { Editor, EditorState, RichUtils, convertToRaw, convertFromRaw, getDefaultKeyBinding } from 'draft-js';
import './RichText.css';
import '../../node_modules/draft-js/dist/Draft.css';
import html2pdf from 'html2pdf.js';
import LLMComponent from './LLMComponent';

class RichTextEditor extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editorState: EditorState.createEmpty(),
            proposalOutline: [],
        };

        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => {
            this.setState({ editorState }, () => {
                this.updateOutline();
            });
        };

        this.handleKeyCommand = this._handleKeyCommand.bind(this);
        this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
        this.toggleBlockType = this._toggleBlockType.bind(this);
        this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
        this.toggleAlignment = this._toggleAlignment.bind(this);
        this.exportToPDF = this._exportToPDF.bind(this);
    }

    updateOutline() {
        const contentState = this.state.editorState.getCurrentContent();
        const blockMap = contentState.getBlockMap();

        const outline = [];

        blockMap.forEach((block) => {
            const type = block.getType();
            const text = block.getText();
            if (type.startsWith('header-')) {
                const level = parseInt(type.split('-')[1], 10);
                outline.push({ level, text });
            }
        });

        this.setState({ proposalOutline: outline });
    }

    _handleKeyCommand(command, editorState) {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    _mapKeyToEditorCommand(e) {
        if (e.keyCode === 9 /* TAB */) {
            const newEditorState = RichUtils.onTab(
                e,
                this.state.editorState,
                4 /* maxDepth */
            );
            if (newEditorState !== this.state.editorState) {
                this.onChange(newEditorState);
            }
            return;
        }
        return getDefaultKeyBinding(e);
    }

    _toggleBlockType(blockType) {
        this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle));
    }

    _toggleAlignment(alignment) {
        this.onChange(RichUtils.toggleBlockType(this.state.editorState, alignment));
    }

    _exportToPDF() {
        const contentState = this.state.editorState.getCurrentContent();
        const rawContent = convertToRaw(contentState);
        const contentHTML = this._convertContentToHTML(rawContent);

        const element = document.createElement('div');
        element.innerHTML = contentHTML;

        element.style.fontFamily = 'Arial, sans-serif';
        element.style.fontSize = '12pt';

        const opt = {
            margin: [0.5, 0.5, 0.5, 0.5], 
            filename: 'document.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    }

    _convertContentToHTML(content) {
        return content.blocks.map(block => {
            switch (block.type) {
                case 'header-one':
                    return `<h1>${block.text}</h1>`;
                case 'header-two':
                    return `<h2>${block.text}</h2>`;
                case 'header-three':
                    return `<h3>${block.text}</h3>`;
                case 'header-four':
                    return `<h4>${block.text}</h4>`;
                case 'header-five':
                    return `<h5>${block.text}</h5>`;
                case 'header-six':
                    return `<h6>${block.text}</h6>`;
                case 'blockquote':
                    return `<blockquote>${block.text}</blockquote>`;
                case 'unordered-list-item':
                    return `<ul><li>${block.text}</li></ul>`;
                case 'ordered-list-item':
                    return `<ol><li>${block.text}</li></ol>`;
                case 'code-block':
                    return `<pre><code>${block.text}</code></pre>`;
                default:
                    return `<p>${block.text}</p>`;
            }
        }).join('');
    }

    render() {
        const { editorState, proposalOutline } = this.state;
        const editorContent = convertToRaw(editorState.getCurrentContent());

        let className = 'RichEditor-editor';
        const contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }

        return (
            <div className="RichEditor-container">
                <div className="RichEditor-sidebar">
                    <ProposalOutlineList
                        outline={proposalOutline}
                    />
                    <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType} />
                    <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle} />
                    <AlignmentControls editorState={editorState} onToggle={this.toggleAlignment} />
                    <button className="RichEditor-button" onClick={this.exportToPDF}>Export to PDF</button>
                </div>
                <div className="RichEditor-editorContainer">
                    <div className={className} onClick={this.focus}>
                        <Editor
                            blockStyleFn={getBlockStyle}
                            customStyleMap={styleMap}
                            editorState={editorState}
                            handleKeyCommand={this.handleKeyCommand}
                            keyBindingFn={this.mapKeyToEditorCommand}
                            onChange={this.onChange}
                            placeholder="Tell a story..."
                            ref="editor"
                            spellCheck={true}
                        />
                    </div>
                </div>
                <div className="RichEditor-llm">
                    <LLMComponent editorContent={editorContent} />
                </div>
            </div>
        );
    }
}

const styleMap = {
    CODE: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 16,
        padding: 2,
    },
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote':
            return 'RichEditor-blockquote';
        case 'align-left':
            return 'RichEditor-align-left';
        case 'align-center':
            return 'RichEditor-align-center';
        case 'align-right':
            return 'RichEditor-align-right';
        case 'align-justify':
            return 'RichEditor-align-justify';
        default:
            return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
    }

    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }
        return (
            <span className={className} onMouseDown={this.onToggle}>
                {this.props.label}
            </span>
        );
    }
}

const BLOCK_TYPES = [
    { label: 'H1', style: 'header-one' },
    { label: 'H2', style: 'header-two' },
    { label: 'H3', style: 'header-three' },
    { label: 'Blockquote', style: 'blockquote' },
    { label: 'UL', style: 'unordered-list-item' },
    { label: 'OL', style: 'ordered-list-item' },
    { label: 'Code Block', style: 'code-block' },
];

const BlockStyleControls = (props) => {
    const { editorState } = props;
    const selection = editorState.getSelection();
    const blockType = RichUtils.getCurrentBlockType(editorState);
    return (
        <div className="RichEditor-controls">
            {BLOCK_TYPES.map((type) =>
                <StyleButton
                    key={type.label}
                    active={type.style === blockType}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </div>
    );
};

const INLINE_STYLES = [
    { label: 'Bold', style: 'BOLD' },
    { label: 'Italic', style: 'ITALIC' },
    { label: 'Underline', style: 'UNDERLINE' },
    { label: 'Monospace', style: 'CODE' },
];

const InlineStyleControls = (props) => {
    const currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        <div className="RichEditor-controls">
            {INLINE_STYLES.map((type) =>
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </div>
    );
};

const ALIGNMENT_CONTROLS = [
    { label: 'Left', style: 'align-left' },
    { label: 'Center', style: 'align-center' },
    { label: 'Right', style: 'align-right' },
    { label: 'Justify', style: 'align-justify' },
];

const AlignmentControls = (props) => {
    const currentStyle = props.editorState.getCurrentInlineStyle();
    return (
        <div className="RichEditor-controls">
            {ALIGNMENT_CONTROLS.map((type) =>
                <StyleButton
                    key={type.label}
                    active={currentStyle.has(type.style)}
                    label={type.label}
                    onToggle={props.onToggle}
                    style={type.style}
                />
            )}
        </div>
    );
};

const ProposalOutlineList = ({ outline }) => (
    <div className="ProposalOutlineList">
        <h3>Proposal Outline</h3>
        <ul>
            {outline.map((item, index) => (
                <li key={index} style={{ marginLeft: item.level * 20 }}>{item.text}</li>
            ))}
        </ul>
    </div>
);

export default RichTextEditor;
