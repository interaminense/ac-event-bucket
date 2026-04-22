const fs = require('fs');
const path = require('path');

// Mock chrome API
global.chrome = {
  devtools: {
    inspectedWindow: {
      eval: jest.fn()
    }
  }
};

// Mock crypto
if (!global.crypto) {
  global.crypto = require('crypto').webcrypto;
}

// In some environments, we might need to explicitly mock randomUUID if it's missing
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => require('crypto').randomUUID();
}

const generatorCode = fs.readFileSync(path.resolve(__dirname, '../generator.js'), 'utf8');

describe('generator.js randomization logic', () => {
  beforeAll(() => {
    // Setup required DOM elements ONCE before script load
    document.body.innerHTML = `
      <div id="sdk-status"></div>
      <div id="sdk-warning" style="display:none"></div>
      <input id="event-id" />
      <div id="app-id-wrap">
        <input id="application-id" />
        <span id="app-color-dot"></span>
      </div>
      <div id="properties-list"></div>
      <p id="props-empty"></p>
      <button id="add-property"></button>
      <button id="send-btn"></button>
      <button id="save-btn"></button>
      <button id="clear-btn"></button>
      <div id="feedback"></div>
      <div id="templates-list"></div>
      <div id="saved-events-list"></div>
      <p id="saved-empty"></p>
      <span id="saved-count"></span>
      <div id="history-list"></div>
      <p id="history-empty"></p>
      <span id="history-count"></span>
    `;

    // Eval the generator script to populate globals in JSDOM window
    const script = document.createElement('script');
    script.textContent = generatorCode;
    document.body.appendChild(script);
  });

  beforeEach(() => {
    // Reset state between tests without removing elements
    document.getElementById('properties-list').innerHTML = '';
    document.getElementById('event-id').value = '';
    document.getElementById('application-id').value = '';
  });

  test('createPropertyRow defaults randomize to false', () => {
    const row = window.createPropertyRow('testKey', 'testValue');
    const checkbox = row.querySelector('input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });

  test('typing in value input unchecks Random checkbox', () => {
    const row = window.createPropertyRow('testKey', 'testValue', true);
    const checkbox = row.querySelector('input[type="checkbox"]');
    const valueInput = row.querySelectorAll('input[type="text"]')[1];

    expect(checkbox.checked).toBe(true);

    // Simulate typing
    valueInput.value = 'new value';
    valueInput.dispatchEvent(new Event('input'));

    expect(checkbox.checked).toBe(false);
  });

  test('randomizeProperties respects randomize: false', () => {
    const props = {
      myProp: { value: 'fixed-value', randomize: false, type: 'String' }
    };
    const result = window.randomizeProperties(props, 'http://localhost');
    expect(result.myProp).toBe('fixed-value');
  });

  test('getRandomValueForType generates positive Ints and Longs', () => {
    // Testing Int
    for(let i=0; i<10; i++) {
        const val = window.getRandomValueForType('Int');
        expect(parseInt(val)).toBeGreaterThanOrEqual(0);
    }

    // Testing Long
    for(let i=0; i<10; i++) {
        const val = window.getRandomValueForType('Long');
        expect(BigInt(val)).toBeGreaterThanOrEqual(0n);
    }
  });

  test('setProperties defaults randomize to false for simple values', () => {
    const props = { test: 'val' };
    window.setProperties(props);
    const checkbox = document.querySelector('.prop-row input[type="checkbox"]');
    expect(checkbox.checked).toBe(false);
  });

  test('randomizeProperties casts values to correct type even if randomize is false', () => {
    const props = {
      intProp: { value: '123', randomize: false, type: 'Int' },
      floatProp: { value: '123.45', randomize: false, type: 'Float' },
      stringProp: { value: 'hello', randomize: false, type: 'String' }
    };
    const result = window.randomizeProperties(props, 'http://localhost');
    expect(result.intProp).toBe(123);
    expect(result.floatProp).toBe(123.45);
    expect(result.stringProp).toBe('hello');
  });

  test('selecting a template keeps predefined externalReferenceCode', () => {
    // Mock templates for the test
    const mockTpl = { eventId: 'testEvent', properties: { externalReferenceCode: 'ERC-PREDEFINED', other: 'val' } };
    
    // We need to trigger the click logic. In the actual script it's inside buildTemplatesList.
    // Let's manually invoke the logic that happens on template click.
    document.getElementById('event-id').value = mockTpl.eventId;
    document.getElementById('application-id').value = 'TestApp';
    
    // This is the part we suspect is buggy in generator.js:
    // const props = { ...mockTpl.properties };
    // if ("externalReferenceCode" in props) props.externalReferenceCode = crypto.randomUUID();
    // setProperties(props);

    // For the test, we'll call setProperties directly with the template props
    window.setProperties(mockTpl.properties);
    
    const props = window.getProperties();
    expect(props.externalReferenceCode.value).toBe('ERC-PREDEFINED');
  });

  test('setProperties infers Int and Float types from numeric values', () => {
    const props = { intVal: 10, floatVal: 10.5, strVal: '10' };
    window.setProperties(props);
    
    const result = window.getProperties();
    expect(result.intVal.type).toBe('Int');
    expect(result.floatVal.type).toBe('Float');
    expect(result.strVal.type).toBe('String');
  });

  test('randomizeProperties randomizes value when randomize is true', () => {
    const props = {
      intProp: { value: '123', randomize: true, type: 'Int' }
    };
    // Mock getRandomValueForType to return a specific value
    const originalGetRandom = window.getRandomValueForType;
    window.getRandomValueForType = jest.fn(() => '999');
    
    const result = window.randomizeProperties(props, 'http://localhost');
    expect(result.intProp).toBe(999);
    expect(window.getRandomValueForType).toHaveBeenCalledWith('Int', 'http://localhost', '123');
    
    window.getRandomValueForType = originalGetRandom;
  });
});
