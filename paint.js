var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.set_print_fn_BANG_ = function set_print_fn_BANG_(f) {
  return cljs.core._STAR_print_fn_STAR_ = f
};
goog.exportSymbol("cljs.core.set_print_fn_BANG_", cljs.core.set_print_fn_BANG_);
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:flush-on-newline", cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0:readably", cljs.core._STAR_print_readably_STAR_, "\ufdd0:meta", cljs.core._STAR_print_meta_STAR_, "\ufdd0:dup", cljs.core._STAR_print_dup_STAR_], true)
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.not_native = null;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.array_QMARK_ = function array_QMARK_(x) {
  return x instanceof Array
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return typeof n === "number"
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return!(x.charAt(0) === "\ufdd0")
  }else {
    return and__3941__auto__
  }
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0:else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  var ty = cljs.core.type(obj);
  var ty__$1 = cljs.core.truth_(function() {
    var and__3941__auto__ = ty;
    if(cljs.core.truth_(and__3941__auto__)) {
      return ty.cljs$lang$type
    }else {
      return and__3941__auto__
    }
  }()) ? ty.cljs$lang$ctorStr : goog.typeOf(obj);
  return new Error(["No protocol method ", proto, " defined for type ", ty__$1, ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.cljs$core$IFn$_invoke$arity$1(size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$core$IFn$_invoke$arity$1 = make_array__1;
  make_array.cljs$core$IFn$_invoke$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4535__delegate = function(array, i, idxs) {
      return cljs.core.apply.cljs$core$IFn$_invoke$arity$3 ? cljs.core.apply.cljs$core$IFn$_invoke$arity$3(aget, aget.cljs$core$IFn$_invoke$arity$2(array, i), idxs) : cljs.core.apply.call(null, aget, aget.cljs$core$IFn$_invoke$arity$2(array, i), idxs)
    };
    var G__4535 = function(array, i, var_args) {
      var idxs = null;
      if(arguments.length > 2) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4535__delegate.call(this, array, i, idxs)
    };
    G__4535.cljs$lang$maxFixedArity = 2;
    G__4535.cljs$lang$applyTo = function(arglist__4536) {
      var array = cljs.core.first(arglist__4536);
      arglist__4536 = cljs.core.next(arglist__4536);
      var i = cljs.core.first(arglist__4536);
      var idxs = cljs.core.rest(arglist__4536);
      return G__4535__delegate(array, i, idxs)
    };
    G__4535.cljs$core$IFn$_invoke$arity$variadic = G__4535__delegate;
    return G__4535
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$core$IFn$_invoke$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$core$IFn$_invoke$arity$2 = aget__2;
  aget.cljs$core$IFn$_invoke$arity$variadic = aget__3.cljs$core$IFn$_invoke$arity$variadic;
  return aget
}();
cljs.core.aset = function() {
  var aset = null;
  var aset__3 = function(array, i, val) {
    return array[i] = val
  };
  var aset__4 = function() {
    var G__4537__delegate = function(array, idx, idx2, idxv) {
      return cljs.core.apply.cljs$core$IFn$_invoke$arity$4 ? cljs.core.apply.cljs$core$IFn$_invoke$arity$4(aset, array[idx], idx2, idxv) : cljs.core.apply.call(null, aset, array[idx], idx2, idxv)
    };
    var G__4537 = function(array, idx, idx2, var_args) {
      var idxv = null;
      if(arguments.length > 3) {
        idxv = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4537__delegate.call(this, array, idx, idx2, idxv)
    };
    G__4537.cljs$lang$maxFixedArity = 3;
    G__4537.cljs$lang$applyTo = function(arglist__4538) {
      var array = cljs.core.first(arglist__4538);
      arglist__4538 = cljs.core.next(arglist__4538);
      var idx = cljs.core.first(arglist__4538);
      arglist__4538 = cljs.core.next(arglist__4538);
      var idx2 = cljs.core.first(arglist__4538);
      var idxv = cljs.core.rest(arglist__4538);
      return G__4537__delegate(array, idx, idx2, idxv)
    };
    G__4537.cljs$core$IFn$_invoke$arity$variadic = G__4537__delegate;
    return G__4537
  }();
  aset = function(array, idx, idx2, var_args) {
    var idxv = var_args;
    switch(arguments.length) {
      case 3:
        return aset__3.call(this, array, idx, idx2);
      default:
        return aset__4.cljs$core$IFn$_invoke$arity$variadic(array, idx, idx2, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aset.cljs$lang$maxFixedArity = 3;
  aset.cljs$lang$applyTo = aset__4.cljs$lang$applyTo;
  aset.cljs$core$IFn$_invoke$arity$3 = aset__3;
  aset.cljs$core$IFn$_invoke$arity$variadic = aset__4.cljs$core$IFn$_invoke$arity$variadic;
  return aset
}();
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.cljs$core$IFn$_invoke$arity$2(null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3 ? cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(a, x) {
      a.push(x);
      return a
    }, [], aseq) : cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$core$IFn$_invoke$arity$1 = into_array__1;
  into_array.cljs$core$IFn$_invoke$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto__ = this$;
      if(and__3941__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2900__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3943__auto__ = cljs.core._invoke[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._invoke["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$core$IFn$_invoke$arity$1 = _invoke__1;
  _invoke.cljs$core$IFn$_invoke$arity$2 = _invoke__2;
  _invoke.cljs$core$IFn$_invoke$arity$3 = _invoke__3;
  _invoke.cljs$core$IFn$_invoke$arity$4 = _invoke__4;
  _invoke.cljs$core$IFn$_invoke$arity$5 = _invoke__5;
  _invoke.cljs$core$IFn$_invoke$arity$6 = _invoke__6;
  _invoke.cljs$core$IFn$_invoke$arity$7 = _invoke__7;
  _invoke.cljs$core$IFn$_invoke$arity$8 = _invoke__8;
  _invoke.cljs$core$IFn$_invoke$arity$9 = _invoke__9;
  _invoke.cljs$core$IFn$_invoke$arity$10 = _invoke__10;
  _invoke.cljs$core$IFn$_invoke$arity$11 = _invoke__11;
  _invoke.cljs$core$IFn$_invoke$arity$12 = _invoke__12;
  _invoke.cljs$core$IFn$_invoke$arity$13 = _invoke__13;
  _invoke.cljs$core$IFn$_invoke$arity$14 = _invoke__14;
  _invoke.cljs$core$IFn$_invoke$arity$15 = _invoke__15;
  _invoke.cljs$core$IFn$_invoke$arity$16 = _invoke__16;
  _invoke.cljs$core$IFn$_invoke$arity$17 = _invoke__17;
  _invoke.cljs$core$IFn$_invoke$arity$18 = _invoke__18;
  _invoke.cljs$core$IFn$_invoke$arity$19 = _invoke__19;
  _invoke.cljs$core$IFn$_invoke$arity$20 = _invoke__20;
  _invoke.cljs$core$IFn$_invoke$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._count[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._count["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._empty[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._empty["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._conj[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2900__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2900__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._nth[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._nth["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$core$IFn$_invoke$arity$2 = _nth__2;
  _nth.cljs$core$IFn$_invoke$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._first[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rest[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._next[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2900__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto__ = o;
      if(and__3941__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2900__auto__ = o == null ? null : o;
      return function() {
        var or__3943__auto__ = cljs.core._lookup[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._lookup["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$core$IFn$_invoke$arity$2 = _lookup__2;
  _lookup.cljs$core$IFn$_invoke$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._key[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._val[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._val["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._peek[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._peek["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._pop[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._meta[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._with_meta[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._with_meta["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2900__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto__ = coll;
      if(and__3941__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2900__auto__ = coll == null ? null : coll;
      return function() {
        var or__3943__auto__ = cljs.core._reduce[goog.typeOf(x__2900__auto__)];
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = cljs.core._reduce["_"];
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            throw cljs.core.missing_protocol("IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$core$IFn$_invoke$arity$2 = _reduce__2;
  _reduce.cljs$core$IFn$_invoke$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._kv_reduce[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._equiv[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._equiv["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._hash[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._hash["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._seq[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._rseq[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._rseq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._entry_key[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._entry_key["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._comparator[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._comparator["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__2900__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._write[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._write["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3941__auto__ = writer;
    if(and__3941__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__2900__auto__ = writer == null ? null : writer;
    return function() {
      var or__3943__auto__ = cljs.core._flush[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._flush["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3941__auto__ = o;
    if(and__3941__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__2900__auto__ = o == null ? null : o;
    return function() {
      var or__3943__auto__ = cljs.core._pr_writer[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto__ = d;
    if(and__3941__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2900__auto__ = d == null ? null : d;
    return function() {
      var or__3943__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2900__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._notify_watches[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2900__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._add_watch[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto__ = this$;
    if(and__3941__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2900__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3943__auto__ = cljs.core._remove_watch[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._as_transient[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._as_transient["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto__ = tcoll;
    if(and__3941__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2900__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2900__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._compare[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._compare["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._drop_first[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._drop_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_first[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_rest[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto__ = coll;
    if(and__3941__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2900__auto__ = coll == null ? null : coll;
    return function() {
      var or__3943__auto__ = cljs.core._chunked_next[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INamed = {};
cljs.core._name = function _name(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_name$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_name$arity$1(x)
  }else {
    var x__2900__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._name[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._name["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("INamed.-name", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._namespace = function _namespace(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$INamed$_namespace$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$INamed$_namespace$arity$1(x)
  }else {
    var x__2900__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._namespace[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._namespace["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("INamed.-namespace", x);
        }
      }
    }().call(null, x)
  }
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorStr = "cljs.core/StringBufferWriter";
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  return null
};
cljs.core.__GT_StringBufferWriter = function __GT_StringBufferWriter(sb) {
  return new cljs.core.StringBufferWriter(sb)
};
cljs.core.pr_str_STAR_ = function pr_str_STAR_(obj) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  obj.cljs$core$IPrintWithWriter$_pr_writer$arity$3(obj, writer, cljs.core.pr_opts());
  cljs.core._flush(writer);
  return[cljs.core.str(sb)].join("")
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  return x instanceof cljs.core.Symbol
};
goog.provide("cljs.core.Symbol");
cljs.core.Symbol = function(ns, name, str, _hash, _meta) {
  this.ns = ns;
  this.name = name;
  this.str = str;
  this._hash = _hash;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition0$ = 2154168321;
  this.cljs$lang$protocol_mask$partition1$ = 4096
};
cljs.core.Symbol.cljs$lang$type = true;
cljs.core.Symbol.cljs$lang$ctorStr = "cljs.core/Symbol";
cljs.core.Symbol.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Symbol")
};
cljs.core.Symbol.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(o, writer, _) {
  var self__ = this;
  return cljs.core._write(writer, self__.str)
};
cljs.core.Symbol.prototype.cljs$core$INamed$_name$arity$1 = function(_) {
  var self__ = this;
  return self__.name
};
cljs.core.Symbol.prototype.cljs$core$INamed$_namespace$arity$1 = function(_) {
  var self__ = this;
  return self__.ns
};
cljs.core.Symbol.prototype.cljs$core$IHash$_hash$arity$1 = function(_) {
  var self__ = this;
  if(self__._hash === -1) {
    self__._hash = cljs.core.hash_combine.cljs$core$IFn$_invoke$arity$2 ? cljs.core.hash_combine.cljs$core$IFn$_invoke$arity$2(cljs.core.hash.cljs$core$IFn$_invoke$arity$1 ? cljs.core.hash.cljs$core$IFn$_invoke$arity$1(self__.ns) : cljs.core.hash.call(null, self__.ns), cljs.core.hash.cljs$core$IFn$_invoke$arity$1 ? cljs.core.hash.cljs$core$IFn$_invoke$arity$1(self__.name) : cljs.core.hash.call(null, self__.name)) : cljs.core.hash_combine.call(null, cljs.core.hash.cljs$core$IFn$_invoke$arity$1 ? cljs.core.hash.cljs$core$IFn$_invoke$arity$1(self__.ns) : 
    cljs.core.hash.call(null, self__.ns), cljs.core.hash.cljs$core$IFn$_invoke$arity$1 ? cljs.core.hash.cljs$core$IFn$_invoke$arity$1(self__.name) : cljs.core.hash.call(null, self__.name));
    return self__._hash
  }else {
    return self__._hash
  }
};
cljs.core.Symbol.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_, new_meta) {
  var self__ = this;
  return new cljs.core.Symbol(self__.ns, self__.name, self__.str, self__._hash, new_meta)
};
cljs.core.Symbol.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__._meta
};
cljs.core.Symbol.prototype.call = function() {
  var G__4540 = null;
  var G__4540__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(coll, sym, null)
  };
  var G__4540__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var sym = self____$1;
    return cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(coll, sym, not_found)
  };
  G__4540 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4540__2.call(this, self__, coll);
      case 3:
        return G__4540__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4540
}();
cljs.core.Symbol.prototype.apply = function(self__, args4539) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4539.slice()))
};
cljs.core.Symbol.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  if(other instanceof cljs.core.Symbol) {
    return self__.str === other.str
  }else {
    return false
  }
};
cljs.core.Symbol.prototype.toString = function() {
  var self__ = this;
  var _ = this;
  return self__.str
};
cljs.core.__GT_Symbol = function __GT_Symbol(ns, name, str, _hash, _meta) {
  return new cljs.core.Symbol(ns, name, str, _hash, _meta)
};
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(name instanceof cljs.core.Symbol) {
      return name
    }else {
      return symbol.cljs$core$IFn$_invoke$arity$2(null, name)
    }
  };
  var symbol__2 = function(ns, name) {
    var sym_str = !(ns == null) ? [cljs.core.str(ns), cljs.core.str("/"), cljs.core.str(name)].join("") : name;
    return new cljs.core.Symbol(ns, name, sym_str, -1, null)
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$core$IFn$_invoke$arity$1 = symbol__1;
  symbol.cljs$core$IFn$_invoke$arity$2 = symbol__2;
  return symbol
}();
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__4542 = coll;
      if(G__4542) {
        if(function() {
          var or__3943__auto__ = G__4542.cljs$lang$protocol_mask$partition0$ & 8388608;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4542.cljs$core$ISeqable$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$ISeqable$_seq$arity$1(coll)
    }else {
      if(coll instanceof Array) {
        if(coll.length === 0) {
          return null
        }else {
          return new cljs.core.IndexedSeq(coll, 0)
        }
      }else {
        if(cljs.core.string_QMARK_(coll)) {
          if(coll.length === 0) {
            return null
          }else {
            return new cljs.core.IndexedSeq(coll, 0)
          }
        }else {
          if(cljs.core.type_satisfies_(cljs.core.ILookup, coll)) {
            return cljs.core._seq(coll)
          }else {
            if("\ufdd0:else") {
              throw new Error([cljs.core.str(coll), cljs.core.str("is not ISeqable")].join(""));
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__4544 = coll;
      if(G__4544) {
        if(function() {
          var or__3943__auto__ = G__4544.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4544.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$ISeq$_first$arity$1(coll)
    }else {
      var s = cljs.core.seq(coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first(s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__4546 = coll;
      if(G__4546) {
        if(function() {
          var or__3943__auto__ = G__4546.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4546.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$ISeq$_rest$arity$1(coll)
    }else {
      var s = cljs.core.seq(coll);
      if(!(s == null)) {
        return cljs.core._rest(s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__4548 = coll;
      if(G__4548) {
        if(function() {
          var or__3943__auto__ = G__4548.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4548.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$INext$_next$arity$1(coll)
    }else {
      return cljs.core.seq(cljs.core.rest(coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto__ = x === y;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return cljs.core._equiv(x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4549__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.cljs$core$IFn$_invoke$arity$2(x, y))) {
          if(cljs.core.next(more)) {
            var G__4550 = y;
            var G__4551 = cljs.core.first(more);
            var G__4552 = cljs.core.next(more);
            x = G__4550;
            y = G__4551;
            more = G__4552;
            continue
          }else {
            return _EQ_.cljs$core$IFn$_invoke$arity$2(y, cljs.core.first(more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4549 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4549__delegate.call(this, x, y, more)
    };
    G__4549.cljs$lang$maxFixedArity = 2;
    G__4549.cljs$lang$applyTo = function(arglist__4553) {
      var x = cljs.core.first(arglist__4553);
      arglist__4553 = cljs.core.next(arglist__4553);
      var y = cljs.core.first(arglist__4553);
      var more = cljs.core.rest(arglist__4553);
      return G__4549__delegate(x, y, more)
    };
    G__4549.cljs$core$IFn$_invoke$arity$variadic = G__4549__delegate;
    return G__4549
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ___1;
  _EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ___2;
  _EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ_
}();
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IKVReduce["null"] = true;
cljs.core._kv_reduce["null"] = function(_, f, init) {
  return init
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto__ = other instanceof Date;
  if(and__3941__auto__) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto__
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return Math.floor(o) % 2147483647
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorStr = "cljs.core/Reduced";
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  return self__.val
};
cljs.core.__GT_Reduced = function __GT_Reduced(val) {
  return new cljs.core.Reduced(val)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return r instanceof cljs.core.Reduced
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count(cicoll);
    if(cnt === 0) {
      return f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)
    }else {
      var val = cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, n)) : f.call(null, val, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, n));
          if(cljs.core.reduced_QMARK_(nval)) {
            return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
          }else {
            var G__4554 = nval;
            var G__4555 = n + 1;
            val = G__4554;
            n = G__4555;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count(cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val__$1, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, n)) : f.call(null, val__$1, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, n));
        if(cljs.core.reduced_QMARK_(nval)) {
          return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
        }else {
          var G__4556 = nval;
          var G__4557 = n + 1;
          val__$1 = G__4556;
          n = G__4557;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count(cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val__$1, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, n)) : f.call(null, val__$1, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(cicoll, n));
        if(cljs.core.reduced_QMARK_(nval)) {
          return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
        }else {
          var G__4558 = nval;
          var G__4559 = n + 1;
          val__$1 = G__4558;
          n = G__4559;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$core$IFn$_invoke$arity$2 = ci_reduce__2;
  ci_reduce.cljs$core$IFn$_invoke$arity$3 = ci_reduce__3;
  ci_reduce.cljs$core$IFn$_invoke$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val, arr[n]) : f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_(nval)) {
            return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
          }else {
            var G__4560 = nval;
            var G__4561 = n + 1;
            val = G__4560;
            n = G__4561;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val__$1, arr[n]) : f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_(nval)) {
          return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
        }else {
          var G__4562 = nval;
          var G__4563 = n + 1;
          val__$1 = G__4562;
          n = G__4563;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val__$1, arr[n]) : f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_(nval)) {
          return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
        }else {
          var G__4564 = nval;
          var G__4565 = n + 1;
          val__$1 = G__4564;
          n = G__4565;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$core$IFn$_invoke$arity$2 = array_reduce__2;
  array_reduce.cljs$core$IFn$_invoke$arity$3 = array_reduce__3;
  array_reduce.cljs$core$IFn$_invoke$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4567 = x;
  if(G__4567) {
    if(function() {
      var or__3943__auto__ = G__4567.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4567.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4567.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ICounted, G__4567)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ICounted, G__4567)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4569 = x;
  if(G__4569) {
    if(function() {
      var or__3943__auto__ = G__4569.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4569.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4569.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IIndexed, G__4569)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IIndexed, G__4569)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(arr, i) {
  this.arr = arr;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorStr = "cljs.core/IndexedSeq";
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.cljs$core$IFn$_invoke$arity$1 ? cljs.core.hash_coll.cljs$core$IFn$_invoke$arity$1(coll) : cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.cljs$core$IFn$_invoke$arity$2 ? cljs.core.cons.cljs$core$IFn$_invoke$arity$2(o, coll) : cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var c = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c > 0) {
    return new cljs.core.RSeq(coll, c - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$4(self__.arr, f, self__.arr[self__.i], self__.i + 1)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$4(self__.arr, f, start, self__.i)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.arr.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  return self__.arr[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.arr.length) {
    return new cljs.core.IndexedSeq(self__.arr, self__.i + 1)
  }else {
    return cljs.core.list.cljs$core$IFn$_invoke$arity$0 ? cljs.core.list.cljs$core$IFn$_invoke$arity$0() : cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.cljs$core$IFn$_invoke$arity$2 ? cljs.core.equiv_sequential.cljs$core$IFn$_invoke$arity$2(coll, other) : cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.arr.length) {
    return self__.arr[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.__GT_IndexedSeq = function __GT_IndexedSeq(arr, i) {
  return new cljs.core.IndexedSeq(arr, i)
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.cljs$core$IFn$_invoke$arity$2(prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$core$IFn$_invoke$arity$1 = prim_seq__1;
  prim_seq.cljs$core$IFn$_invoke$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2(array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$core$IFn$_invoke$arity$1 = array_seq__1;
  array_seq.cljs$core$IFn$_invoke$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function(col, f) {
  return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$2(col, f)
};
cljs.core._reduce["array"] = function(col, f, start) {
  return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$3(col, f, start)
};
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorStr = "cljs.core/RSeq";
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.cljs$core$IFn$_invoke$arity$1 ? cljs.core.hash_coll.cljs$core$IFn$_invoke$arity$1(coll) : cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.cljs$core$IFn$_invoke$arity$2 ? cljs.core.cons.cljs$core$IFn$_invoke$arity$2(o, coll) : cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.cljs$core$IFn$_invoke$arity$2 ? cljs.core.equiv_sequential.cljs$core$IFn$_invoke$arity$2(coll, other) : cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.cljs$core$IFn$_invoke$arity$2 ? cljs.core.with_meta.cljs$core$IFn$_invoke$arity$2(cljs.core.List.EMPTY, self__.meta) : cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_RSeq = function __GT_RSeq(ci, i, meta) {
  return new cljs.core.RSeq(ci, i, meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first(cljs.core.next(coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first(cljs.core.first(coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next(cljs.core.first(coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first(cljs.core.next(coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next(cljs.core.next(coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next(s);
    if(!(sn == null)) {
      var G__4570 = sn;
      s = G__4570;
      continue
    }else {
      return cljs.core.first(s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    if(!(coll == null)) {
      return cljs.core._conj(coll, x)
    }else {
      return cljs.core.list.cljs$core$IFn$_invoke$arity$1 ? cljs.core.list.cljs$core$IFn$_invoke$arity$1(x) : cljs.core.list.call(null, x)
    }
  };
  var conj__3 = function() {
    var G__4571__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4572 = conj.cljs$core$IFn$_invoke$arity$2(coll, x);
          var G__4573 = cljs.core.first(xs);
          var G__4574 = cljs.core.next(xs);
          coll = G__4572;
          x = G__4573;
          xs = G__4574;
          continue
        }else {
          return conj.cljs$core$IFn$_invoke$arity$2(coll, x)
        }
        break
      }
    };
    var G__4571 = function(coll, x, var_args) {
      var xs = null;
      if(arguments.length > 2) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4571__delegate.call(this, coll, x, xs)
    };
    G__4571.cljs$lang$maxFixedArity = 2;
    G__4571.cljs$lang$applyTo = function(arglist__4575) {
      var coll = cljs.core.first(arglist__4575);
      arglist__4575 = cljs.core.next(arglist__4575);
      var x = cljs.core.first(arglist__4575);
      var xs = cljs.core.rest(arglist__4575);
      return G__4571__delegate(coll, x, xs)
    };
    G__4571.cljs$core$IFn$_invoke$arity$variadic = G__4571__delegate;
    return G__4571
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$core$IFn$_invoke$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$core$IFn$_invoke$arity$2 = conj__2;
  conj.cljs$core$IFn$_invoke$arity$variadic = conj__3.cljs$core$IFn$_invoke$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty(coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq(coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_(s)) {
      return acc + cljs.core._count(s)
    }else {
      var G__4576 = cljs.core.next(s);
      var G__4577 = acc + 1;
      s = G__4576;
      acc = G__4577;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__4579 = coll;
      if(G__4579) {
        if(function() {
          var or__3943__auto__ = G__4579.cljs$lang$protocol_mask$partition0$ & 2;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4579.cljs$core$ICounted$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$ICounted$_count$arity$1(coll)
    }else {
      if(coll instanceof Array) {
        return coll.length
      }else {
        if(cljs.core.string_QMARK_(coll)) {
          return coll.length
        }else {
          if(cljs.core.type_satisfies_(cljs.core.ICounted, coll)) {
            return cljs.core._count(coll)
          }else {
            if("\ufdd0:else") {
              return cljs.core.accumulating_seq_count(coll)
            }else {
              return null
            }
          }
        }
      }
    }
  }else {
    return 0
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq(coll)) {
            return cljs.core.first(coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_(coll)) {
            return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(coll, n)
          }else {
            if(cljs.core.seq(coll)) {
              var G__4580 = cljs.core.next(coll);
              var G__4581 = n - 1;
              coll = G__4580;
              n = G__4581;
              continue
            }else {
              if("\ufdd0:else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq(coll)) {
            return cljs.core.first(coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_(coll)) {
            return cljs.core._nth.cljs$core$IFn$_invoke$arity$3(coll, n, not_found)
          }else {
            if(cljs.core.seq(coll)) {
              var G__4582 = cljs.core.next(coll);
              var G__4583 = n - 1;
              var G__4584 = not_found;
              coll = G__4582;
              n = G__4583;
              not_found = G__4584;
              continue
            }else {
              if("\ufdd0:else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$core$IFn$_invoke$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__4587 = coll;
        if(G__4587) {
          if(function() {
            var or__3943__auto__ = G__4587.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4587.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return coll.cljs$core$IIndexed$_nth$arity$2(coll, Math.floor(n))
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return null
          }
        }else {
          if(cljs.core.string_QMARK_(coll)) {
            if(n < coll.length) {
              return coll[n]
            }else {
              return null
            }
          }else {
            if(cljs.core.type_satisfies_(cljs.core.IIndexed, coll)) {
              return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(coll, n)
            }else {
              if("\ufdd0:else") {
                return cljs.core.linear_traversal_nth.cljs$core$IFn$_invoke$arity$2(coll, Math.floor(n))
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__4588 = coll;
        if(G__4588) {
          if(function() {
            var or__3943__auto__ = G__4588.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4588.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return coll.cljs$core$IIndexed$_nth$arity$3(coll, Math.floor(n), not_found)
      }else {
        if(coll instanceof Array) {
          if(n < coll.length) {
            return coll[n]
          }else {
            return not_found
          }
        }else {
          if(cljs.core.string_QMARK_(coll)) {
            if(n < coll.length) {
              return coll[n]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.type_satisfies_(cljs.core.IIndexed, coll)) {
              return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(coll, n)
            }else {
              if("\ufdd0:else") {
                return cljs.core.linear_traversal_nth.cljs$core$IFn$_invoke$arity$3(coll, Math.floor(n), not_found)
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$core$IFn$_invoke$arity$2 = nth__2;
  nth.cljs$core$IFn$_invoke$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    if(o == null) {
      return null
    }else {
      if(function() {
        var G__4591 = o;
        if(G__4591) {
          if(function() {
            var or__3943__auto__ = G__4591.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4591.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return o.cljs$core$ILookup$_lookup$arity$2(o, k)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return null
          }
        }else {
          if(cljs.core.string_QMARK_(o)) {
            if(k < o.length) {
              return o[k]
            }else {
              return null
            }
          }else {
            if(cljs.core.type_satisfies_(cljs.core.ILookup, o)) {
              return cljs.core._lookup.cljs$core$IFn$_invoke$arity$2(o, k)
            }else {
              if("\ufdd0:else") {
                return null
              }else {
                return null
              }
            }
          }
        }
      }
    }
  };
  var get__3 = function(o, k, not_found) {
    if(!(o == null)) {
      if(function() {
        var G__4592 = o;
        if(G__4592) {
          if(function() {
            var or__3943__auto__ = G__4592.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4592.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            return false
          }
        }else {
          return false
        }
      }()) {
        return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
      }else {
        if(o instanceof Array) {
          if(k < o.length) {
            return o[k]
          }else {
            return not_found
          }
        }else {
          if(cljs.core.string_QMARK_(o)) {
            if(k < o.length) {
              return o[k]
            }else {
              return not_found
            }
          }else {
            if(cljs.core.type_satisfies_(cljs.core.ILookup, o)) {
              return cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(o, k, not_found)
            }else {
              if("\ufdd0:else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
    }else {
      return not_found
    }
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$core$IFn$_invoke$arity$2 = get__2;
  get.cljs$core$IFn$_invoke$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    if(!(coll == null)) {
      return cljs.core._assoc(coll, k, v)
    }else {
      return cljs.core.hash_map.cljs$core$IFn$_invoke$arity$2 ? cljs.core.hash_map.cljs$core$IFn$_invoke$arity$2(k, v) : cljs.core.hash_map.call(null, k, v)
    }
  };
  var assoc__4 = function() {
    var G__4593__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.cljs$core$IFn$_invoke$arity$3(coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4594 = ret;
          var G__4595 = cljs.core.first(kvs);
          var G__4596 = cljs.core.second(kvs);
          var G__4597 = cljs.core.nnext(kvs);
          coll = G__4594;
          k = G__4595;
          v = G__4596;
          kvs = G__4597;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__4593 = function(coll, k, v, var_args) {
      var kvs = null;
      if(arguments.length > 3) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4593__delegate.call(this, coll, k, v, kvs)
    };
    G__4593.cljs$lang$maxFixedArity = 3;
    G__4593.cljs$lang$applyTo = function(arglist__4598) {
      var coll = cljs.core.first(arglist__4598);
      arglist__4598 = cljs.core.next(arglist__4598);
      var k = cljs.core.first(arglist__4598);
      arglist__4598 = cljs.core.next(arglist__4598);
      var v = cljs.core.first(arglist__4598);
      var kvs = cljs.core.rest(arglist__4598);
      return G__4593__delegate(coll, k, v, kvs)
    };
    G__4593.cljs$core$IFn$_invoke$arity$variadic = G__4593__delegate;
    return G__4593
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$core$IFn$_invoke$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$core$IFn$_invoke$arity$3 = assoc__3;
  assoc.cljs$core$IFn$_invoke$arity$variadic = assoc__4.cljs$core$IFn$_invoke$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc(coll, k)
  };
  var dissoc__3 = function() {
    var G__4599__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.cljs$core$IFn$_invoke$arity$2(coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4600 = ret;
          var G__4601 = cljs.core.first(ks);
          var G__4602 = cljs.core.next(ks);
          coll = G__4600;
          k = G__4601;
          ks = G__4602;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__4599 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4599__delegate.call(this, coll, k, ks)
    };
    G__4599.cljs$lang$maxFixedArity = 2;
    G__4599.cljs$lang$applyTo = function(arglist__4603) {
      var coll = cljs.core.first(arglist__4603);
      arglist__4603 = cljs.core.next(arglist__4603);
      var k = cljs.core.first(arglist__4603);
      var ks = cljs.core.rest(arglist__4603);
      return G__4599__delegate(coll, k, ks)
    };
    G__4599.cljs$core$IFn$_invoke$arity$variadic = G__4599__delegate;
    return G__4599
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$core$IFn$_invoke$arity$1 = dissoc__1;
  dissoc.cljs$core$IFn$_invoke$arity$2 = dissoc__2;
  dissoc.cljs$core$IFn$_invoke$arity$variadic = dissoc__3.cljs$core$IFn$_invoke$arity$variadic;
  return dissoc
}();
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3943__auto__ = goog.isFunction(f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__4605 = f;
    if(G__4605) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____$1 = null;
        if(cljs.core.truth_(or__3943__auto____$1)) {
          return or__3943__auto____$1
        }else {
          return G__4605.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__4605.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_(cljs.core.Fn, G__4605)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.Fn, G__4605)
    }
  }
};
cljs.core.with_meta = function with_meta(o, meta) {
  if(function() {
    var and__3941__auto__ = cljs.core.fn_QMARK_(o);
    if(and__3941__auto__) {
      return!function() {
        var G__4611 = o;
        if(G__4611) {
          if(function() {
            var or__3943__auto__ = G__4611.cljs$lang$protocol_mask$partition0$ & 262144;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4611.cljs$core$IWithMeta$
            }
          }()) {
            return true
          }else {
            if(!G__4611.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.IWithMeta, G__4611)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.IWithMeta, G__4611)
        }
      }()
    }else {
      return and__3941__auto__
    }
  }()) {
    return with_meta(function() {
      if(void 0 === cljs.core.t4612) {
        goog.provide("cljs.core.t4612");
        cljs.core.t4612 = function(meta, o, with_meta, meta4613) {
          this.meta = meta;
          this.o = o;
          this.with_meta = with_meta;
          this.meta4613 = meta4613;
          this.cljs$lang$protocol_mask$partition1$ = 0;
          this.cljs$lang$protocol_mask$partition0$ = 393217
        };
        cljs.core.t4612.cljs$lang$type = true;
        cljs.core.t4612.cljs$lang$ctorStr = "cljs.core/t4612";
        cljs.core.t4612.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
          return cljs.core._write(writer__2842__auto__, "cljs.core/t4612")
        };
        cljs.core.t4612.prototype.call = function() {
          var G__4616__delegate = function(self__, args) {
            var self____$1 = this;
            var _ = self____$1;
            return cljs.core.apply.cljs$core$IFn$_invoke$arity$2 ? cljs.core.apply.cljs$core$IFn$_invoke$arity$2(self__.o, args) : cljs.core.apply.call(null, self__.o, args)
          };
          var G__4616 = function(self__, var_args) {
            var self__ = this;
            var args = null;
            if(arguments.length > 1) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
            }
            return G__4616__delegate.call(this, self__, args)
          };
          G__4616.cljs$lang$maxFixedArity = 1;
          G__4616.cljs$lang$applyTo = function(arglist__4617) {
            var self__ = cljs.core.first(arglist__4617);
            var args = cljs.core.rest(arglist__4617);
            return G__4616__delegate(self__, args)
          };
          G__4616.cljs$core$IFn$_invoke$arity$variadic = G__4616__delegate;
          return G__4616
        }();
        cljs.core.t4612.prototype.apply = function(self__, args4615) {
          var self__ = this;
          return self__.call.apply(self__, [self__].concat(args4615.slice()))
        };
        cljs.core.t4612.prototype.cljs$core$Fn$ = true;
        cljs.core.t4612.prototype.cljs$core$IMeta$_meta$arity$1 = function(_4614) {
          var self__ = this;
          return self__.meta4613
        };
        cljs.core.t4612.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_4614, meta4613__$1) {
          var self__ = this;
          return new cljs.core.t4612(self__.meta, self__.o, self__.with_meta, meta4613__$1)
        };
        cljs.core.__GT_t4612 = function __GT_t4612(meta__$1, o__$1, with_meta__$1, meta4613) {
          return new cljs.core.t4612(meta__$1, o__$1, with_meta__$1, meta4613)
        }
      }else {
      }
      return new cljs.core.t4612(meta, o, with_meta, null)
    }(), meta)
  }else {
    return cljs.core._with_meta(o, meta)
  }
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4619 = o;
    if(G__4619) {
      if(function() {
        var or__3943__auto__ = G__4619.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4619.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4619.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IMeta, G__4619)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IMeta, G__4619)
    }
  }()) {
    return cljs.core._meta(o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek(coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop(coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin(coll, k)
  };
  var disj__3 = function() {
    var G__4620__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.cljs$core$IFn$_invoke$arity$2(coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4621 = ret;
          var G__4622 = cljs.core.first(ks);
          var G__4623 = cljs.core.next(ks);
          coll = G__4621;
          k = G__4622;
          ks = G__4623;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__4620 = function(coll, k, var_args) {
      var ks = null;
      if(arguments.length > 2) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4620__delegate.call(this, coll, k, ks)
    };
    G__4620.cljs$lang$maxFixedArity = 2;
    G__4620.cljs$lang$applyTo = function(arglist__4624) {
      var coll = cljs.core.first(arglist__4624);
      arglist__4624 = cljs.core.next(arglist__4624);
      var k = cljs.core.first(arglist__4624);
      var ks = cljs.core.rest(arglist__4624);
      return G__4620__delegate(coll, k, ks)
    };
    G__4620.cljs$core$IFn$_invoke$arity$variadic = G__4620__delegate;
    return G__4620
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$core$IFn$_invoke$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$core$IFn$_invoke$arity$1 = disj__1;
  disj.cljs$core$IFn$_invoke$arity$2 = disj__2;
  disj.cljs$core$IFn$_invoke$arity$variadic = disj__3.cljs$core$IFn$_invoke$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(typeof h === "number") {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache(k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.cljs$core$IFn$_invoke$arity$2(o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto__ = goog.isString(o);
      if(and__3941__auto__) {
        return check_cache
      }else {
        return and__3941__auto__
      }
    }()) {
      return cljs.core.check_string_hash_cache(o)
    }else {
      return cljs.core._hash(o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash.cljs$core$IFn$_invoke$arity$1 = hash__1;
  hash.cljs$core$IFn$_invoke$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3943__auto__ = coll == null;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return cljs.core.not(cljs.core.seq(coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4626 = x;
    if(G__4626) {
      if(function() {
        var or__3943__auto__ = G__4626.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4626.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4626.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ICollection, G__4626)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ICollection, G__4626)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4628 = x;
    if(G__4628) {
      if(function() {
        var or__3943__auto__ = G__4628.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4628.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4628.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ISet, G__4628)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ISet, G__4628)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4630 = x;
  if(G__4630) {
    if(function() {
      var or__3943__auto__ = G__4630.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4630.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4630.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IAssociative, G__4630)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IAssociative, G__4630)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4632 = x;
  if(G__4632) {
    if(function() {
      var or__3943__auto__ = G__4632.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4632.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4632.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ISequential, G__4632)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ISequential, G__4632)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4634 = x;
  if(G__4634) {
    if(function() {
      var or__3943__auto__ = G__4634.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4634.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4634.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IReduce, G__4634)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IReduce, G__4634)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4636 = x;
    if(G__4636) {
      if(function() {
        var or__3943__auto__ = G__4636.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4636.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4636.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IMap, G__4636)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IMap, G__4636)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4638 = x;
  if(G__4638) {
    if(function() {
      var or__3943__auto__ = G__4638.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4638.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4638.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IVector, G__4638)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IVector, G__4638)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var or__3943__auto__ = x instanceof cljs.core.ChunkedCons;
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    return x instanceof cljs.core.ChunkedSeq
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4639__delegate = function(keyvals) {
      return cljs.core.apply.cljs$core$IFn$_invoke$arity$2 ? cljs.core.apply.cljs$core$IFn$_invoke$arity$2(goog.object.create, keyvals) : cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4639 = function(var_args) {
      var keyvals = null;
      if(arguments.length > 0) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4639__delegate.call(this, keyvals)
    };
    G__4639.cljs$lang$maxFixedArity = 0;
    G__4639.cljs$lang$applyTo = function(arglist__4640) {
      var keyvals = cljs.core.seq(arglist__4640);
      return G__4639__delegate(keyvals)
    };
    G__4639.cljs$core$IFn$_invoke$arity$variadic = G__4639__delegate;
    return G__4639
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$core$IFn$_invoke$arity$0 = js_obj__0;
  js_obj.cljs$core$IFn$_invoke$arity$variadic = js_obj__1.cljs$core$IFn$_invoke$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__4641 = i__$1 + 1;
      var G__4642 = j__$1 + 1;
      var G__4643 = len__$1 - 1;
      i__$1 = G__4641;
      j__$1 = G__4642;
      len__$1 = G__4643;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__4644 = i__$1 - 1;
      var G__4645 = j__$1 - 1;
      var G__4646 = len__$1 - 1;
      i__$1 = G__4644;
      j__$1 = G__4645;
      len__$1 = G__4646;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4648 = s;
    if(G__4648) {
      if(function() {
        var or__3943__auto__ = G__4648.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4648.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4648.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.ISeq, G__4648)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.ISeq, G__4648)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4650 = s;
  if(G__4650) {
    if(function() {
      var or__3943__auto__ = G__4650.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4650.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4650.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.ISeqable, G__4650)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.ISeqable, G__4650)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto__ = goog.isString(x);
  if(and__3941__auto__) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto__
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto__ = cljs.core.fn_QMARK_(f);
  if(or__3943__auto__) {
    return or__3943__auto__
  }else {
    var G__4652 = f;
    if(G__4652) {
      if(function() {
        var or__3943__auto____$1 = G__4652.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          return G__4652.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4652.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.IFn, G__4652)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IFn, G__4652)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto__ = typeof n === "number";
  if(and__3941__auto__) {
    var and__3941__auto____$1 = !isNaN(n);
    if(and__3941__auto____$1) {
      var and__3941__auto____$2 = !(n === Infinity);
      if(and__3941__auto____$2) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3941__auto____$2
      }
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.get.cljs$core$IFn$_invoke$arity$3(coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3941__auto__ = !(coll == null);
    if(and__3941__auto__) {
      var and__3941__auto____$1 = cljs.core.associative_QMARK_(coll);
      if(and__3941__auto____$1) {
        return cljs.core.contains_QMARK_(coll, k)
      }else {
        return and__3941__auto____$1
      }
    }else {
      return and__3941__auto__
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core.get.cljs$core$IFn$_invoke$arity$2(coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__4653__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, null, x, null], true);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first(xs);
          var etc = cljs.core.next(xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_(s, x__$1)) {
              return false
            }else {
              var G__4654 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(s, x__$1);
              var G__4655 = etc;
              s = G__4654;
              xs = G__4655;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4653 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4653__delegate.call(this, x, y, more)
    };
    G__4653.cljs$lang$maxFixedArity = 2;
    G__4653.cljs$lang$applyTo = function(arglist__4656) {
      var x = cljs.core.first(arglist__4656);
      arglist__4656 = cljs.core.next(arglist__4656);
      var y = cljs.core.first(arglist__4656);
      var more = cljs.core.rest(arglist__4656);
      return G__4653__delegate(x, y, more)
    };
    G__4653.cljs$core$IFn$_invoke$arity$variadic = G__4653__delegate;
    return G__4653
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$core$IFn$_invoke$arity$variadic = distinct_QMARK___3.cljs$core$IFn$_invoke$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type(x) === cljs.core.type(y)) {
          if(function() {
            var G__4658 = x;
            if(G__4658) {
              if(function() {
                var or__3943__auto__ = G__4658.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return G__4658.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                return false
              }
            }else {
              return false
            }
          }()) {
            return x.cljs$core$IComparable$_compare$arity$2(x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0:else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count(xs);
    var yl = cljs.core.count(ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if("\ufdd0:else") {
          return compare_indexed.cljs$core$IFn$_invoke$arity$4(xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(xs, n), cljs.core.nth.cljs$core$IFn$_invoke$arity$2(ys, n));
      if(function() {
        var and__3941__auto__ = d === 0;
        if(and__3941__auto__) {
          return n + 1 < len
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__4659 = xs;
        var G__4660 = ys;
        var G__4661 = len;
        var G__4662 = n + 1;
        xs = G__4659;
        ys = G__4660;
        len = G__4661;
        n = G__4662;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$core$IFn$_invoke$arity$2 = compare_indexed__2;
  compare_indexed.cljs$core$IFn$_invoke$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(x, y) : f.call(null, x, y);
      if(typeof r === "number") {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(y, x) : f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.cljs$core$IFn$_invoke$arity$2(cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq(coll)) {
      var a = cljs.core.to_array.cljs$core$IFn$_invoke$arity$1 ? cljs.core.to_array.cljs$core$IFn$_invoke$arity$1(coll) : cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator(comp));
      return cljs.core.seq(a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$core$IFn$_invoke$arity$1 = sort__1;
  sort.cljs$core$IFn$_invoke$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.cljs$core$IFn$_invoke$arity$3(keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.cljs$core$IFn$_invoke$arity$2(function(x, y) {
      return cljs.core.fn__GT_comparator(comp).call(null, keyfn.cljs$core$IFn$_invoke$arity$1 ? keyfn.cljs$core$IFn$_invoke$arity$1(x) : keyfn.call(null, x), keyfn.cljs$core$IFn$_invoke$arity$1 ? keyfn.cljs$core$IFn$_invoke$arity$1(y) : keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$core$IFn$_invoke$arity$2 = sort_by__2;
  sort_by.cljs$core$IFn$_invoke$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto__ = cljs.core.seq(coll);
    if(temp__4090__auto__) {
      var s = temp__4090__auto__;
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3 ? cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(f, cljs.core.first(s), cljs.core.next(s)) : cljs.core.reduce.call(null, f, cljs.core.first(s), cljs.core.next(s))
    }else {
      return f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq(coll);
    while(true) {
      if(coll__$1) {
        var nval = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(val__$1, cljs.core.first(coll__$1)) : f.call(null, val__$1, cljs.core.first(coll__$1));
        if(cljs.core.reduced_QMARK_(nval)) {
          return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(nval) : cljs.core.deref.call(null, nval)
        }else {
          var G__4663 = nval;
          var G__4664 = cljs.core.next(coll__$1);
          val__$1 = G__4663;
          coll__$1 = G__4664;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$core$IFn$_invoke$arity$2 = seq_reduce__2;
  seq_reduce.cljs$core$IFn$_invoke$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.cljs$core$IFn$_invoke$arity$1 ? cljs.core.to_array.cljs$core$IFn$_invoke$arity$1(coll) : cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.cljs$core$IFn$_invoke$arity$1 ? cljs.core.vec.cljs$core$IFn$_invoke$arity$1(a) : cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4667 = coll;
      if(G__4667) {
        if(function() {
          var or__3943__auto__ = G__4667.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4667.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$2(coll, f)
      }else {
        if(cljs.core.string_QMARK_(coll)) {
          return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$2(coll, f)
        }else {
          if(cljs.core.type_satisfies_(cljs.core.IReduce, coll)) {
            return cljs.core._reduce.cljs$core$IFn$_invoke$arity$2(coll, f)
          }else {
            if("\ufdd0:else") {
              return cljs.core.seq_reduce.cljs$core$IFn$_invoke$arity$2(f, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4668 = coll;
      if(G__4668) {
        if(function() {
          var or__3943__auto__ = G__4668.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4668.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, val)
    }else {
      if(coll instanceof Array) {
        return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$3(coll, f, val)
      }else {
        if(cljs.core.string_QMARK_(coll)) {
          return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$3(coll, f, val)
        }else {
          if(cljs.core.type_satisfies_(cljs.core.IReduce, coll)) {
            return cljs.core._reduce.cljs$core$IFn$_invoke$arity$3(coll, f, val)
          }else {
            if("\ufdd0:else") {
              return cljs.core.seq_reduce.cljs$core$IFn$_invoke$arity$3(f, val, coll)
            }else {
              return null
            }
          }
        }
      }
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$core$IFn$_invoke$arity$2 = reduce__2;
  reduce.cljs$core$IFn$_invoke$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce(coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4669__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(_PLUS_, x + y, more)
    };
    var G__4669 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4669__delegate.call(this, x, y, more)
    };
    G__4669.cljs$lang$maxFixedArity = 2;
    G__4669.cljs$lang$applyTo = function(arglist__4670) {
      var x = cljs.core.first(arglist__4670);
      arglist__4670 = cljs.core.next(arglist__4670);
      var y = cljs.core.first(arglist__4670);
      var more = cljs.core.rest(arglist__4670);
      return G__4669__delegate(x, y, more)
    };
    G__4669.cljs$core$IFn$_invoke$arity$variadic = G__4669__delegate;
    return G__4669
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$core$IFn$_invoke$arity$0 = _PLUS___0;
  _PLUS_.cljs$core$IFn$_invoke$arity$1 = _PLUS___1;
  _PLUS_.cljs$core$IFn$_invoke$arity$2 = _PLUS___2;
  _PLUS_.cljs$core$IFn$_invoke$arity$variadic = _PLUS___3.cljs$core$IFn$_invoke$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4671__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(_, x - y, more)
    };
    var G__4671 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4671__delegate.call(this, x, y, more)
    };
    G__4671.cljs$lang$maxFixedArity = 2;
    G__4671.cljs$lang$applyTo = function(arglist__4672) {
      var x = cljs.core.first(arglist__4672);
      arglist__4672 = cljs.core.next(arglist__4672);
      var y = cljs.core.first(arglist__4672);
      var more = cljs.core.rest(arglist__4672);
      return G__4671__delegate(x, y, more)
    };
    G__4671.cljs$core$IFn$_invoke$arity$variadic = G__4671__delegate;
    return G__4671
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$core$IFn$_invoke$arity$1 = ___1;
  _.cljs$core$IFn$_invoke$arity$2 = ___2;
  _.cljs$core$IFn$_invoke$arity$variadic = ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4673__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(_STAR_, x * y, more)
    };
    var G__4673 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4673__delegate.call(this, x, y, more)
    };
    G__4673.cljs$lang$maxFixedArity = 2;
    G__4673.cljs$lang$applyTo = function(arglist__4674) {
      var x = cljs.core.first(arglist__4674);
      arglist__4674 = cljs.core.next(arglist__4674);
      var y = cljs.core.first(arglist__4674);
      var more = cljs.core.rest(arglist__4674);
      return G__4673__delegate(x, y, more)
    };
    G__4673.cljs$core$IFn$_invoke$arity$variadic = G__4673__delegate;
    return G__4673
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$core$IFn$_invoke$arity$0 = _STAR___0;
  _STAR_.cljs$core$IFn$_invoke$arity$1 = _STAR___1;
  _STAR_.cljs$core$IFn$_invoke$arity$2 = _STAR___2;
  _STAR_.cljs$core$IFn$_invoke$arity$variadic = _STAR___3.cljs$core$IFn$_invoke$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.cljs$core$IFn$_invoke$arity$2(1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4675__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(_SLASH_, _SLASH_.cljs$core$IFn$_invoke$arity$2(x, y), more)
    };
    var G__4675 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4675__delegate.call(this, x, y, more)
    };
    G__4675.cljs$lang$maxFixedArity = 2;
    G__4675.cljs$lang$applyTo = function(arglist__4676) {
      var x = cljs.core.first(arglist__4676);
      arglist__4676 = cljs.core.next(arglist__4676);
      var y = cljs.core.first(arglist__4676);
      var more = cljs.core.rest(arglist__4676);
      return G__4675__delegate(x, y, more)
    };
    G__4675.cljs$core$IFn$_invoke$arity$variadic = G__4675__delegate;
    return G__4675
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$core$IFn$_invoke$arity$1 = _SLASH___1;
  _SLASH_.cljs$core$IFn$_invoke$arity$2 = _SLASH___2;
  _SLASH_.cljs$core$IFn$_invoke$arity$variadic = _SLASH___3.cljs$core$IFn$_invoke$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4677__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next(more)) {
            var G__4678 = y;
            var G__4679 = cljs.core.first(more);
            var G__4680 = cljs.core.next(more);
            x = G__4678;
            y = G__4679;
            more = G__4680;
            continue
          }else {
            return y < cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4677 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4677__delegate.call(this, x, y, more)
    };
    G__4677.cljs$lang$maxFixedArity = 2;
    G__4677.cljs$lang$applyTo = function(arglist__4681) {
      var x = cljs.core.first(arglist__4681);
      arglist__4681 = cljs.core.next(arglist__4681);
      var y = cljs.core.first(arglist__4681);
      var more = cljs.core.rest(arglist__4681);
      return G__4677__delegate(x, y, more)
    };
    G__4677.cljs$core$IFn$_invoke$arity$variadic = G__4677__delegate;
    return G__4677
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$core$IFn$_invoke$arity$1 = _LT___1;
  _LT_.cljs$core$IFn$_invoke$arity$2 = _LT___2;
  _LT_.cljs$core$IFn$_invoke$arity$variadic = _LT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4682__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next(more)) {
            var G__4683 = y;
            var G__4684 = cljs.core.first(more);
            var G__4685 = cljs.core.next(more);
            x = G__4683;
            y = G__4684;
            more = G__4685;
            continue
          }else {
            return y <= cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4682 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4682__delegate.call(this, x, y, more)
    };
    G__4682.cljs$lang$maxFixedArity = 2;
    G__4682.cljs$lang$applyTo = function(arglist__4686) {
      var x = cljs.core.first(arglist__4686);
      arglist__4686 = cljs.core.next(arglist__4686);
      var y = cljs.core.first(arglist__4686);
      var more = cljs.core.rest(arglist__4686);
      return G__4682__delegate(x, y, more)
    };
    G__4682.cljs$core$IFn$_invoke$arity$variadic = G__4682__delegate;
    return G__4682
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _LT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4687__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next(more)) {
            var G__4688 = y;
            var G__4689 = cljs.core.first(more);
            var G__4690 = cljs.core.next(more);
            x = G__4688;
            y = G__4689;
            more = G__4690;
            continue
          }else {
            return y > cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4687 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4687__delegate.call(this, x, y, more)
    };
    G__4687.cljs$lang$maxFixedArity = 2;
    G__4687.cljs$lang$applyTo = function(arglist__4691) {
      var x = cljs.core.first(arglist__4691);
      arglist__4691 = cljs.core.next(arglist__4691);
      var y = cljs.core.first(arglist__4691);
      var more = cljs.core.rest(arglist__4691);
      return G__4687__delegate(x, y, more)
    };
    G__4687.cljs$core$IFn$_invoke$arity$variadic = G__4687__delegate;
    return G__4687
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$core$IFn$_invoke$arity$1 = _GT___1;
  _GT_.cljs$core$IFn$_invoke$arity$2 = _GT___2;
  _GT_.cljs$core$IFn$_invoke$arity$variadic = _GT___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4692__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next(more)) {
            var G__4693 = y;
            var G__4694 = cljs.core.first(more);
            var G__4695 = cljs.core.next(more);
            x = G__4693;
            y = G__4694;
            more = G__4695;
            continue
          }else {
            return y >= cljs.core.first(more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4692 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4692__delegate.call(this, x, y, more)
    };
    G__4692.cljs$lang$maxFixedArity = 2;
    G__4692.cljs$lang$applyTo = function(arglist__4696) {
      var x = cljs.core.first(arglist__4696);
      arglist__4696 = cljs.core.next(arglist__4696);
      var y = cljs.core.first(arglist__4696);
      var more = cljs.core.rest(arglist__4696);
      return G__4692__delegate(x, y, more)
    };
    G__4692.cljs$core$IFn$_invoke$arity$variadic = G__4692__delegate;
    return G__4692
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$core$IFn$_invoke$arity$variadic = _GT__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4697__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(max, x > y ? x : y, more)
    };
    var G__4697 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4697__delegate.call(this, x, y, more)
    };
    G__4697.cljs$lang$maxFixedArity = 2;
    G__4697.cljs$lang$applyTo = function(arglist__4698) {
      var x = cljs.core.first(arglist__4698);
      arglist__4698 = cljs.core.next(arglist__4698);
      var y = cljs.core.first(arglist__4698);
      var more = cljs.core.rest(arglist__4698);
      return G__4697__delegate(x, y, more)
    };
    G__4697.cljs$core$IFn$_invoke$arity$variadic = G__4697__delegate;
    return G__4697
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$core$IFn$_invoke$arity$1 = max__1;
  max.cljs$core$IFn$_invoke$arity$2 = max__2;
  max.cljs$core$IFn$_invoke$arity$variadic = max__3.cljs$core$IFn$_invoke$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4699__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(min, x < y ? x : y, more)
    };
    var G__4699 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4699__delegate.call(this, x, y, more)
    };
    G__4699.cljs$lang$maxFixedArity = 2;
    G__4699.cljs$lang$applyTo = function(arglist__4700) {
      var x = cljs.core.first(arglist__4700);
      arglist__4700 = cljs.core.next(arglist__4700);
      var y = cljs.core.first(arglist__4700);
      var more = cljs.core.rest(arglist__4700);
      return G__4699__delegate(x, y, more)
    };
    G__4699.cljs$core$IFn$_invoke$arity$variadic = G__4699__delegate;
    return G__4699
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$core$IFn$_invoke$arity$1 = min__1;
  min.cljs$core$IFn$_invoke$arity$2 = min__2;
  min.cljs$core$IFn$_invoke$arity$variadic = min__3.cljs$core$IFn$_invoke$arity$variadic;
  return min
}();
cljs.core.byte$ = function byte$(x) {
  return x
};
cljs.core.char$ = function char$(x) {
  if(typeof x === "number") {
    return String.fromCharCode(x)
  }else {
    if(function() {
      var and__3941__auto__ = cljs.core.string_QMARK_(x);
      if(and__3941__auto__) {
        return x.length === 1
      }else {
        return and__3941__auto__
      }
    }()) {
      return x
    }else {
      if("\ufdd0:else") {
        throw new Error("Argument to char must be a character or number");
      }else {
        return null
      }
    }
  }
};
cljs.core.short$ = function short$(x) {
  return x
};
cljs.core.float$ = function float$(x) {
  return x
};
cljs.core.double$ = function double$(x) {
  return x
};
cljs.core.unchecked_byte = function unchecked_byte(x) {
  return x
};
cljs.core.unchecked_char = function unchecked_char(x) {
  return x
};
cljs.core.unchecked_short = function unchecked_short(x) {
  return x
};
cljs.core.unchecked_float = function unchecked_float(x) {
  return x
};
cljs.core.unchecked_double = function unchecked_double(x) {
  return x
};
cljs.core.unchecked_add = function() {
  var unchecked_add = null;
  var unchecked_add__0 = function() {
    return 0
  };
  var unchecked_add__1 = function(x) {
    return x
  };
  var unchecked_add__2 = function(x, y) {
    return x + y
  };
  var unchecked_add__3 = function() {
    var G__4701__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_add, x + y, more)
    };
    var G__4701 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4701__delegate.call(this, x, y, more)
    };
    G__4701.cljs$lang$maxFixedArity = 2;
    G__4701.cljs$lang$applyTo = function(arglist__4702) {
      var x = cljs.core.first(arglist__4702);
      arglist__4702 = cljs.core.next(arglist__4702);
      var y = cljs.core.first(arglist__4702);
      var more = cljs.core.rest(arglist__4702);
      return G__4701__delegate(x, y, more)
    };
    G__4701.cljs$core$IFn$_invoke$arity$variadic = G__4701__delegate;
    return G__4701
  }();
  unchecked_add = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add__0.call(this);
      case 1:
        return unchecked_add__1.call(this, x);
      case 2:
        return unchecked_add__2.call(this, x, y);
      default:
        return unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add.cljs$lang$maxFixedArity = 2;
  unchecked_add.cljs$lang$applyTo = unchecked_add__3.cljs$lang$applyTo;
  unchecked_add.cljs$core$IFn$_invoke$arity$0 = unchecked_add__0;
  unchecked_add.cljs$core$IFn$_invoke$arity$1 = unchecked_add__1;
  unchecked_add.cljs$core$IFn$_invoke$arity$2 = unchecked_add__2;
  unchecked_add.cljs$core$IFn$_invoke$arity$variadic = unchecked_add__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add
}();
cljs.core.unchecked_add_int = function() {
  var unchecked_add_int = null;
  var unchecked_add_int__0 = function() {
    return 0
  };
  var unchecked_add_int__1 = function(x) {
    return x
  };
  var unchecked_add_int__2 = function(x, y) {
    return x + y
  };
  var unchecked_add_int__3 = function() {
    var G__4703__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_add_int, x + y, more)
    };
    var G__4703 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4703__delegate.call(this, x, y, more)
    };
    G__4703.cljs$lang$maxFixedArity = 2;
    G__4703.cljs$lang$applyTo = function(arglist__4704) {
      var x = cljs.core.first(arglist__4704);
      arglist__4704 = cljs.core.next(arglist__4704);
      var y = cljs.core.first(arglist__4704);
      var more = cljs.core.rest(arglist__4704);
      return G__4703__delegate(x, y, more)
    };
    G__4703.cljs$core$IFn$_invoke$arity$variadic = G__4703__delegate;
    return G__4703
  }();
  unchecked_add_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_add_int__0.call(this);
      case 1:
        return unchecked_add_int__1.call(this, x);
      case 2:
        return unchecked_add_int__2.call(this, x, y);
      default:
        return unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_add_int.cljs$lang$maxFixedArity = 2;
  unchecked_add_int.cljs$lang$applyTo = unchecked_add_int__3.cljs$lang$applyTo;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$0 = unchecked_add_int__0;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$1 = unchecked_add_int__1;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$2 = unchecked_add_int__2;
  unchecked_add_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_add_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_add_int
}();
cljs.core.unchecked_dec = function unchecked_dec(x) {
  return x - 1
};
cljs.core.unchecked_dec_int = function unchecked_dec_int(x) {
  return x - 1
};
cljs.core.unchecked_divide_int = function() {
  var unchecked_divide_int = null;
  var unchecked_divide_int__1 = function(x) {
    return unchecked_divide_int.cljs$core$IFn$_invoke$arity$2(1, x)
  };
  var unchecked_divide_int__2 = function(x, y) {
    return x / y
  };
  var unchecked_divide_int__3 = function() {
    var G__4705__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_divide_int, unchecked_divide_int.cljs$core$IFn$_invoke$arity$2(x, y), more)
    };
    var G__4705 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4705__delegate.call(this, x, y, more)
    };
    G__4705.cljs$lang$maxFixedArity = 2;
    G__4705.cljs$lang$applyTo = function(arglist__4706) {
      var x = cljs.core.first(arglist__4706);
      arglist__4706 = cljs.core.next(arglist__4706);
      var y = cljs.core.first(arglist__4706);
      var more = cljs.core.rest(arglist__4706);
      return G__4705__delegate(x, y, more)
    };
    G__4705.cljs$core$IFn$_invoke$arity$variadic = G__4705__delegate;
    return G__4705
  }();
  unchecked_divide_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_divide_int__1.call(this, x);
      case 2:
        return unchecked_divide_int__2.call(this, x, y);
      default:
        return unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_divide_int.cljs$lang$maxFixedArity = 2;
  unchecked_divide_int.cljs$lang$applyTo = unchecked_divide_int__3.cljs$lang$applyTo;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$1 = unchecked_divide_int__1;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$2 = unchecked_divide_int__2;
  unchecked_divide_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_divide_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_divide_int
}();
cljs.core.unchecked_inc = function unchecked_inc(x) {
  return x + 1
};
cljs.core.unchecked_inc_int = function unchecked_inc_int(x) {
  return x + 1
};
cljs.core.unchecked_multiply = function() {
  var unchecked_multiply = null;
  var unchecked_multiply__0 = function() {
    return 1
  };
  var unchecked_multiply__1 = function(x) {
    return x
  };
  var unchecked_multiply__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply__3 = function() {
    var G__4707__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_multiply, x * y, more)
    };
    var G__4707 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4707__delegate.call(this, x, y, more)
    };
    G__4707.cljs$lang$maxFixedArity = 2;
    G__4707.cljs$lang$applyTo = function(arglist__4708) {
      var x = cljs.core.first(arglist__4708);
      arglist__4708 = cljs.core.next(arglist__4708);
      var y = cljs.core.first(arglist__4708);
      var more = cljs.core.rest(arglist__4708);
      return G__4707__delegate(x, y, more)
    };
    G__4707.cljs$core$IFn$_invoke$arity$variadic = G__4707__delegate;
    return G__4707
  }();
  unchecked_multiply = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply__0.call(this);
      case 1:
        return unchecked_multiply__1.call(this, x);
      case 2:
        return unchecked_multiply__2.call(this, x, y);
      default:
        return unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply.cljs$lang$maxFixedArity = 2;
  unchecked_multiply.cljs$lang$applyTo = unchecked_multiply__3.cljs$lang$applyTo;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply__0;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply__1;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply__2;
  unchecked_multiply.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply
}();
cljs.core.unchecked_multiply_int = function() {
  var unchecked_multiply_int = null;
  var unchecked_multiply_int__0 = function() {
    return 1
  };
  var unchecked_multiply_int__1 = function(x) {
    return x
  };
  var unchecked_multiply_int__2 = function(x, y) {
    return x * y
  };
  var unchecked_multiply_int__3 = function() {
    var G__4709__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_multiply_int, x * y, more)
    };
    var G__4709 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4709__delegate.call(this, x, y, more)
    };
    G__4709.cljs$lang$maxFixedArity = 2;
    G__4709.cljs$lang$applyTo = function(arglist__4710) {
      var x = cljs.core.first(arglist__4710);
      arglist__4710 = cljs.core.next(arglist__4710);
      var y = cljs.core.first(arglist__4710);
      var more = cljs.core.rest(arglist__4710);
      return G__4709__delegate(x, y, more)
    };
    G__4709.cljs$core$IFn$_invoke$arity$variadic = G__4709__delegate;
    return G__4709
  }();
  unchecked_multiply_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return unchecked_multiply_int__0.call(this);
      case 1:
        return unchecked_multiply_int__1.call(this, x);
      case 2:
        return unchecked_multiply_int__2.call(this, x, y);
      default:
        return unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_multiply_int.cljs$lang$maxFixedArity = 2;
  unchecked_multiply_int.cljs$lang$applyTo = unchecked_multiply_int__3.cljs$lang$applyTo;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$0 = unchecked_multiply_int__0;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$1 = unchecked_multiply_int__1;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$2 = unchecked_multiply_int__2;
  unchecked_multiply_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_multiply_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_multiply_int
}();
cljs.core.unchecked_negate = function unchecked_negate(x) {
  return-x
};
cljs.core.unchecked_negate_int = function unchecked_negate_int(x) {
  return-x
};
cljs.core.unchecked_remainder_int = function unchecked_remainder_int(x, n) {
  return cljs.core.mod.cljs$core$IFn$_invoke$arity$2 ? cljs.core.mod.cljs$core$IFn$_invoke$arity$2(x, n) : cljs.core.mod.call(null, x, n)
};
cljs.core.unchecked_substract = function() {
  var unchecked_substract = null;
  var unchecked_substract__1 = function(x) {
    return-x
  };
  var unchecked_substract__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract__3 = function() {
    var G__4711__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_substract, x - y, more)
    };
    var G__4711 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4711__delegate.call(this, x, y, more)
    };
    G__4711.cljs$lang$maxFixedArity = 2;
    G__4711.cljs$lang$applyTo = function(arglist__4712) {
      var x = cljs.core.first(arglist__4712);
      arglist__4712 = cljs.core.next(arglist__4712);
      var y = cljs.core.first(arglist__4712);
      var more = cljs.core.rest(arglist__4712);
      return G__4711__delegate(x, y, more)
    };
    G__4711.cljs$core$IFn$_invoke$arity$variadic = G__4711__delegate;
    return G__4711
  }();
  unchecked_substract = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract__1.call(this, x);
      case 2:
        return unchecked_substract__2.call(this, x, y);
      default:
        return unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract.cljs$lang$maxFixedArity = 2;
  unchecked_substract.cljs$lang$applyTo = unchecked_substract__3.cljs$lang$applyTo;
  unchecked_substract.cljs$core$IFn$_invoke$arity$1 = unchecked_substract__1;
  unchecked_substract.cljs$core$IFn$_invoke$arity$2 = unchecked_substract__2;
  unchecked_substract.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract
}();
cljs.core.unchecked_substract_int = function() {
  var unchecked_substract_int = null;
  var unchecked_substract_int__1 = function(x) {
    return-x
  };
  var unchecked_substract_int__2 = function(x, y) {
    return x - y
  };
  var unchecked_substract_int__3 = function() {
    var G__4713__delegate = function(x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(unchecked_substract_int, x - y, more)
    };
    var G__4713 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4713__delegate.call(this, x, y, more)
    };
    G__4713.cljs$lang$maxFixedArity = 2;
    G__4713.cljs$lang$applyTo = function(arglist__4714) {
      var x = cljs.core.first(arglist__4714);
      arglist__4714 = cljs.core.next(arglist__4714);
      var y = cljs.core.first(arglist__4714);
      var more = cljs.core.rest(arglist__4714);
      return G__4713__delegate(x, y, more)
    };
    G__4713.cljs$core$IFn$_invoke$arity$variadic = G__4713__delegate;
    return G__4713
  }();
  unchecked_substract_int = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return unchecked_substract_int__1.call(this, x);
      case 2:
        return unchecked_substract_int__2.call(this, x, y);
      default:
        return unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  unchecked_substract_int.cljs$lang$maxFixedArity = 2;
  unchecked_substract_int.cljs$lang$applyTo = unchecked_substract_int__3.cljs$lang$applyTo;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$1 = unchecked_substract_int__1;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$2 = unchecked_substract_int__2;
  unchecked_substract_int.cljs$core$IFn$_invoke$arity$variadic = unchecked_substract_int__3.cljs$core$IFn$_invoke$arity$variadic;
  return unchecked_substract_int
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.cljs$core$IFn$_invoke$arity$1 ? Math.floor.cljs$core$IFn$_invoke$arity$1(q) : Math.floor.call(null, q)
  }else {
    return Math.ceil.cljs$core$IFn$_invoke$arity$1 ? Math.ceil.cljs$core$IFn$_invoke$arity$1(q) : Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return x | 0
};
cljs.core.unchecked_int = function unchecked_int(x) {
  return cljs.core.fix(x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix(x)
};
cljs.core.unchecked_long = function unchecked_long(x) {
  return cljs.core.fix(x)
};
cljs.core.booleans = function booleans(x) {
  return x
};
cljs.core.bytes = function bytes(x) {
  return x
};
cljs.core.chars = function chars(x) {
  return x
};
cljs.core.shorts = function shorts(x) {
  return x
};
cljs.core.ints = function ints(x) {
  return x
};
cljs.core.floats = function floats(x) {
  return x
};
cljs.core.doubles = function doubles(x) {
  return x
};
cljs.core.longs = function longs(x) {
  return x
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix((n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot(n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.cljs$core$IFn$_invoke$arity$0 ? Math.random.cljs$core$IFn$_invoke$arity$0() : Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.cljs$core$IFn$_invoke$arity$0()
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix(cljs.core.rand.cljs$core$IFn$_invoke$arity$1(n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv(x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4715__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.cljs$core$IFn$_invoke$arity$2(x, y))) {
          if(cljs.core.next(more)) {
            var G__4716 = y;
            var G__4717 = cljs.core.first(more);
            var G__4718 = cljs.core.next(more);
            x = G__4716;
            y = G__4717;
            more = G__4718;
            continue
          }else {
            return _EQ__EQ_.cljs$core$IFn$_invoke$arity$2(y, cljs.core.first(more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4715 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4715__delegate.call(this, x, y, more)
    };
    G__4715.cljs$lang$maxFixedArity = 2;
    G__4715.cljs$lang$applyTo = function(arglist__4719) {
      var x = cljs.core.first(arglist__4719);
      arglist__4719 = cljs.core.next(arglist__4719);
      var y = cljs.core.first(arglist__4719);
      var more = cljs.core.rest(arglist__4719);
      return G__4715__delegate(x, y, more)
    };
    G__4715.cljs$core$IFn$_invoke$arity$variadic = G__4715__delegate;
    return G__4715
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$core$IFn$_invoke$arity$variadic = _EQ__EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq(coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = xs;
      if(and__3941__auto__) {
        return n__$1 > 0
      }else {
        return and__3941__auto__
      }
    }())) {
      var G__4720 = n__$1 - 1;
      var G__4721 = cljs.core.next(xs);
      n__$1 = G__4720;
      xs = G__4721;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0:else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4722__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4723 = sb.append(str_STAR_.cljs$core$IFn$_invoke$arity$1(cljs.core.first(more)));
            var G__4724 = cljs.core.next(more);
            sb = G__4723;
            more = G__4724;
            continue
          }else {
            return str_STAR_.cljs$core$IFn$_invoke$arity$1(sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.cljs$core$IFn$_invoke$arity$1(x)), ys)
    };
    var G__4722 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4722__delegate.call(this, x, ys)
    };
    G__4722.cljs$lang$maxFixedArity = 1;
    G__4722.cljs$lang$applyTo = function(arglist__4725) {
      var x = cljs.core.first(arglist__4725);
      var ys = cljs.core.rest(arglist__4725);
      return G__4722__delegate(x, ys)
    };
    G__4722.cljs$core$IFn$_invoke$arity$variadic = G__4722__delegate;
    return G__4722
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$core$IFn$_invoke$arity$0 = str_STAR___0;
  str_STAR_.cljs$core$IFn$_invoke$arity$1 = str_STAR___1;
  str_STAR_.cljs$core$IFn$_invoke$arity$variadic = str_STAR___2.cljs$core$IFn$_invoke$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.keyword_QMARK_(x)) {
      return cljs.core.str_STAR_.cljs$core$IFn$_invoke$arity$variadic(":", cljs.core.array_seq([x.substring(2, x.length)], 0))
    }else {
      if(x == null) {
        return""
      }else {
        if("\ufdd0:else") {
          return x.toString()
        }else {
          return null
        }
      }
    }
  };
  var str__2 = function() {
    var G__4726__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4727 = sb.append(str.cljs$core$IFn$_invoke$arity$1(cljs.core.first(more)));
            var G__4728 = cljs.core.next(more);
            sb = G__4727;
            more = G__4728;
            continue
          }else {
            return cljs.core.str_STAR_.cljs$core$IFn$_invoke$arity$1(sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.cljs$core$IFn$_invoke$arity$1(x)), ys)
    };
    var G__4726 = function(x, var_args) {
      var ys = null;
      if(arguments.length > 1) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4726__delegate.call(this, x, ys)
    };
    G__4726.cljs$lang$maxFixedArity = 1;
    G__4726.cljs$lang$applyTo = function(arglist__4729) {
      var x = cljs.core.first(arglist__4729);
      var ys = cljs.core.rest(arglist__4729);
      return G__4726__delegate(x, ys)
    };
    G__4726.cljs$core$IFn$_invoke$arity$variadic = G__4726__delegate;
    return G__4726
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$core$IFn$_invoke$arity$0 = str__0;
  str.cljs$core$IFn$_invoke$arity$1 = str__1;
  str.cljs$core$IFn$_invoke$arity$variadic = str__2.cljs$core$IFn$_invoke$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$core$IFn$_invoke$arity$2 = subs__2;
  subs.cljs$core$IFn$_invoke$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__$1 = cljs.core.map.cljs$core$IFn$_invoke$arity$2 ? cljs.core.map.cljs$core$IFn$_invoke$arity$2(function(x) {
      if(function() {
        var or__3943__auto__ = cljs.core.keyword_QMARK_(x);
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return x instanceof cljs.core.Symbol
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args) : cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3943__auto__ = cljs.core.keyword_QMARK_(x);
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return x instanceof cljs.core.Symbol
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.cljs$core$IFn$_invoke$arity$3 ? cljs.core.apply.cljs$core$IFn$_invoke$arity$3(goog.string.format, fmt, args__$1) : cljs.core.apply.call(null, goog.string.format, fmt, args__$1)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__4730) {
    var fmt = cljs.core.first(arglist__4730);
    var args = cljs.core.rest(arglist__4730);
    return format__delegate(fmt, args)
  };
  format.cljs$core$IFn$_invoke$arity$variadic = format__delegate;
  return format
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_(name)) {
      return name
    }else {
      if(name instanceof cljs.core.Symbol) {
        return cljs.core.str_STAR_.cljs$core$IFn$_invoke$arity$variadic("\ufdd0", cljs.core.array_seq([":", cljs.core.name.cljs$core$IFn$_invoke$arity$1 ? cljs.core.name.cljs$core$IFn$_invoke$arity$1(name) : cljs.core.name.call(null, name)], 0))
      }else {
        if("\ufdd0:else") {
          return cljs.core.str_STAR_.cljs$core$IFn$_invoke$arity$variadic("\ufdd0", cljs.core.array_seq([":", name], 0))
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.cljs$core$IFn$_invoke$arity$1(cljs.core.str_STAR_.cljs$core$IFn$_invoke$arity$variadic(ns, cljs.core.array_seq(["/", name], 0)))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$core$IFn$_invoke$arity$1 = keyword__1;
  keyword.cljs$core$IFn$_invoke$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$(cljs.core.sequential_QMARK_(y) ? function() {
    var xs = cljs.core.seq(x);
    var ys = cljs.core.seq(y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(xs), cljs.core.first(ys))) {
            var G__4731 = cljs.core.next(xs);
            var G__4732 = cljs.core.next(ys);
            xs = G__4731;
            ys = G__4732;
            continue
          }else {
            if("\ufdd0:else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__4733_SHARP_, p2__4734_SHARP_) {
    return cljs.core.hash_combine(p1__4733_SHARP_, cljs.core.hash.cljs$core$IFn$_invoke$arity$2(p2__4734_SHARP_, false))
  }, cljs.core.hash.cljs$core$IFn$_invoke$arity$2(cljs.core.first(coll), false), cljs.core.next(coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq(m);
  while(true) {
    if(s) {
      var e = cljs.core.first(s);
      var G__4735 = (h + (cljs.core.hash.cljs$core$IFn$_invoke$arity$1(cljs.core.key.cljs$core$IFn$_invoke$arity$1 ? cljs.core.key.cljs$core$IFn$_invoke$arity$1(e) : cljs.core.key.call(null, e)) ^ cljs.core.hash.cljs$core$IFn$_invoke$arity$1(cljs.core.val.cljs$core$IFn$_invoke$arity$1 ? cljs.core.val.cljs$core$IFn$_invoke$arity$1(e) : cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__4736 = cljs.core.next(s);
      h = G__4735;
      s = G__4736;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq(s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first(s__$1);
      var G__4737 = (h + cljs.core.hash.cljs$core$IFn$_invoke$arity$1(e)) % 4503599627370496;
      var G__4738 = cljs.core.next(s__$1);
      h = G__4737;
      s__$1 = G__4738;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var seq__4745_4751 = cljs.core.seq(fn_map);
  var chunk__4746_4752 = null;
  var count__4747_4753 = 0;
  var i__4748_4754 = 0;
  while(true) {
    if(i__4748_4754 < count__4747_4753) {
      var vec__4749_4755 = chunk__4746_4752.cljs$core$IIndexed$_nth$arity$2(chunk__4746_4752, i__4748_4754);
      var key_name_4756 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4749_4755, 0, null);
      var f_4757 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4749_4755, 1, null);
      var str_name_4758 = cljs.core.name.cljs$core$IFn$_invoke$arity$1 ? cljs.core.name.cljs$core$IFn$_invoke$arity$1(key_name_4756) : cljs.core.name.call(null, key_name_4756);
      obj[str_name_4758] = f_4757;
      var G__4759 = seq__4745_4751;
      var G__4760 = chunk__4746_4752;
      var G__4761 = count__4747_4753;
      var G__4762 = i__4748_4754 + 1;
      seq__4745_4751 = G__4759;
      chunk__4746_4752 = G__4760;
      count__4747_4753 = G__4761;
      i__4748_4754 = G__4762;
      continue
    }else {
      var temp__4092__auto___4763 = cljs.core.seq(seq__4745_4751);
      if(temp__4092__auto___4763) {
        var seq__4745_4764__$1 = temp__4092__auto___4763;
        if(cljs.core.chunked_seq_QMARK_(seq__4745_4764__$1)) {
          var c__3031__auto___4765 = cljs.core.chunk_first.cljs$core$IFn$_invoke$arity$1 ? cljs.core.chunk_first.cljs$core$IFn$_invoke$arity$1(seq__4745_4764__$1) : cljs.core.chunk_first.call(null, seq__4745_4764__$1);
          var G__4766 = cljs.core.chunk_rest.cljs$core$IFn$_invoke$arity$1 ? cljs.core.chunk_rest.cljs$core$IFn$_invoke$arity$1(seq__4745_4764__$1) : cljs.core.chunk_rest.call(null, seq__4745_4764__$1);
          var G__4767 = c__3031__auto___4765;
          var G__4768 = cljs.core.count(c__3031__auto___4765);
          var G__4769 = 0;
          seq__4745_4751 = G__4766;
          chunk__4746_4752 = G__4767;
          count__4747_4753 = G__4768;
          i__4748_4754 = G__4769;
          continue
        }else {
          var vec__4750_4770 = cljs.core.first(seq__4745_4764__$1);
          var key_name_4771 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4750_4770, 0, null);
          var f_4772 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4750_4770, 1, null);
          var str_name_4773 = cljs.core.name.cljs$core$IFn$_invoke$arity$1 ? cljs.core.name.cljs$core$IFn$_invoke$arity$1(key_name_4771) : cljs.core.name.call(null, key_name_4771);
          obj[str_name_4773] = f_4772;
          var G__4774 = cljs.core.next(seq__4745_4764__$1);
          var G__4775 = null;
          var G__4776 = 0;
          var G__4777 = 0;
          seq__4745_4751 = G__4774;
          chunk__4746_4752 = G__4775;
          count__4747_4753 = G__4776;
          i__4748_4754 = G__4777;
          continue
        }
      }else {
      }
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65937646
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorStr = "cljs.core/List";
cljs.core.List.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, coll, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.List.prototype.cljs$core$IReduce$_reduce$arity$2 = function(col, f) {
  var self__ = this;
  return cljs.core.seq_reduce.cljs$core$IFn$_invoke$arity$2(f, col)
};
cljs.core.List.prototype.cljs$core$IReduce$_reduce$arity$3 = function(col, f, start) {
  var self__ = this;
  return cljs.core.seq_reduce.cljs$core$IFn$_invoke$arity$3(f, start, col)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.__GT_List = function __GT_List(meta, first, rest, count, __hash) {
  return new cljs.core.List(meta, first, rest, count, __hash)
};
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorStr = "cljs.core/EmptyList";
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.__GT_EmptyList = function __GT_EmptyList(meta) {
  return new cljs.core.EmptyList(meta)
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__4779 = coll;
  if(G__4779) {
    if(function() {
      var or__3943__auto__ = G__4779.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4779.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__4779.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IReversible, G__4779)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IReversible, G__4779)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq(coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_(coll)) {
    return cljs.core.rseq(coll)
  }else {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list__delegate = function(xs) {
    var arr = xs instanceof cljs.core.IndexedSeq ? xs.arr : function() {
      var arr = [];
      var xs__$1 = xs;
      while(true) {
        if(!(xs__$1 == null)) {
          arr.push(xs__$1.cljs$core$ISeq$_first$arity$1(xs__$1));
          var G__4780 = xs__$1.cljs$core$INext$_next$arity$1(xs__$1);
          xs__$1 = G__4780;
          continue
        }else {
          return arr
        }
        break
      }
    }();
    var i = arr.length;
    var r = cljs.core.List.EMPTY;
    while(true) {
      if(i > 0) {
        var G__4781 = i - 1;
        var G__4782 = r.cljs$core$ICollection$_conj$arity$2(r, arr[i - 1]);
        i = G__4781;
        r = G__4782;
        continue
      }else {
        return r
      }
      break
    }
  };
  var list = function(var_args) {
    var xs = null;
    if(arguments.length > 0) {
      xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, xs)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__4783) {
    var xs = cljs.core.seq(arglist__4783);
    return list__delegate(xs)
  };
  list.cljs$core$IFn$_invoke$arity$variadic = list__delegate;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorStr = "cljs.core/Cons";
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core._seq(self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.Cons(null, o, coll, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_Cons = function __GT_Cons(meta, first, rest, __hash) {
  return new cljs.core.Cons(meta, first, rest, __hash)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto__ = coll == null;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var G__4785 = coll;
      if(G__4785) {
        if(function() {
          var or__3943__auto____$1 = G__4785.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            return G__4785.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq(coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__4787 = x;
  if(G__4787) {
    if(function() {
      var or__3943__auto__ = G__4787.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return G__4787.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__4787.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_(cljs.core.IList, G__4787)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_(cljs.core.IList, G__4787)
  }
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorStr = "cljs.core/Keyword";
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__4791 = null;
  var G__4791__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__4789 = coll;
        if(G__4789) {
          if(function() {
            var or__3943__auto__ = G__4789.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4789.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            if(!G__4789.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.ILookup, G__4789)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.ILookup, G__4789)
        }
      }()) {
        return cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(coll, self__.k, null)
      }else {
        return null
      }
    }
  };
  var G__4791__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return not_found
    }else {
      if(function() {
        var G__4790 = coll;
        if(G__4790) {
          if(function() {
            var or__3943__auto__ = G__4790.cljs$lang$protocol_mask$partition0$ & 256;
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return G__4790.cljs$core$ILookup$
            }
          }()) {
            return true
          }else {
            if(!G__4790.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_(cljs.core.ILookup, G__4790)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(cljs.core.ILookup, G__4790)
        }
      }()) {
        return cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(coll, self__.k, not_found)
      }else {
        return null
      }
    }
  };
  G__4791 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4791__2.call(this, self__, coll);
      case 3:
        return G__4791__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4791
}();
cljs.core.Keyword.prototype.apply = function(self__, args4788) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4788.slice()))
};
cljs.core.__GT_Keyword = function __GT_Keyword(k) {
  return new cljs.core.Keyword(k)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__4793 = null;
  var G__4793__2 = function(self__, coll) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core.get.cljs$core$IFn$_invoke$arity$2(coll, this$.toString())
  };
  var G__4793__3 = function(self__, coll, not_found) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core.get.cljs$core$IFn$_invoke$arity$3(coll, this$.toString(), not_found)
  };
  G__4793 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4793__2.call(this, self__, coll);
      case 3:
        return G__4793__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4793
}();
String.prototype.apply = function(self__, args4792) {
  return self__.call.apply(self__, [self__].concat(args4792.slice()))
};
String.prototype.apply = function(s, args) {
  if(args.length < 2) {
    return cljs.core.get.cljs$core$IFn$_invoke$arity$2(args[0], s)
  }else {
    return cljs.core.get.cljs$core$IFn$_invoke$arity$3(args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x = lazy_seq.x;
  if(lazy_seq.realized) {
    return x
  }else {
    lazy_seq.x = x.cljs$core$IFn$_invoke$arity$0 ? x.cljs$core$IFn$_invoke$arity$0() : x.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorStr = "cljs.core/LazySeq";
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._seq(coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.seq(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest(cljs.core.lazy_seq_value(coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.LazySeq(meta__$1, self__.realized, self__.x, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_LazySeq = function __GT_LazySeq(meta, realized, x, __hash) {
  return new cljs.core.LazySeq(meta, realized, x, __hash)
};
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorStr = "cljs.core/ChunkBuffer";
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.__GT_ChunkBuffer = function __GT_ChunkBuffer(buf, end) {
  return new cljs.core.ChunkBuffer(buf, end)
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(new Array(capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorStr = "cljs.core/ArrayChunk";
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$4(self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.cljs$core$IFn$_invoke$arity$4(self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = i >= 0;
    if(and__3941__auto__) {
      return i < self__.end - self__.off
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end - self__.off
};
cljs.core.__GT_ArrayChunk = function __GT_ArrayChunk(arr, off, end) {
  return new cljs.core.ArrayChunk(arr, off, end)
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return new cljs.core.ArrayChunk(arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return new cljs.core.ArrayChunk(arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$core$IFn$_invoke$arity$1 = array_chunk__1;
  array_chunk.cljs$core$IFn$_invoke$arity$2 = array_chunk__2;
  array_chunk.cljs$core$IFn$_invoke$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850604;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorStr = "cljs.core/ChunkedCons";
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  return cljs.core.cons(o, this$)
};
cljs.core.ChunkedCons.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count(self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first(self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.__GT_ChunkedCons = function __GT_ChunkedCons(chunk, more, meta, __hash) {
  return new cljs.core.ChunkedCons(chunk, more, meta, __hash)
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count(chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first(s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest(s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__4795 = s;
    if(G__4795) {
      if(function() {
        var or__3943__auto__ = G__4795.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__4795.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return cljs.core._chunked_next(s)
  }else {
    return cljs.core.seq(cljs.core._chunked_rest(s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq(s__$1)) {
      ary.push(cljs.core.first(s__$1));
      var G__4796 = cljs.core.next(s__$1);
      s__$1 = G__4796;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = new Array(cljs.core.count(coll));
  var i_4797 = 0;
  var xs_4798 = cljs.core.seq(coll);
  while(true) {
    if(xs_4798) {
      ret[i_4797] = cljs.core.to_array(cljs.core.first(xs_4798));
      var G__4799 = i_4797 + 1;
      var G__4800 = cljs.core.next(xs_4798);
      i_4797 = G__4799;
      xs_4798 = G__4800;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.int_array = function() {
  var int_array = null;
  var int_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return int_array.cljs$core$IFn$_invoke$arity$2(size_or_seq, null)
    }else {
      return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(size_or_seq)
    }
  };
  var int_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s = cljs.core.seq(init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first(s__$1);
          var G__4801 = i + 1;
          var G__4802 = cljs.core.next(s__$1);
          i = G__4801;
          s__$1 = G__4802;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3078__auto___4803 = size;
      var i_4804 = 0;
      while(true) {
        if(i_4804 < n__3078__auto___4803) {
          a[i_4804] = init_val_or_seq;
          var G__4805 = i_4804 + 1;
          i_4804 = G__4805;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  int_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return int_array__1.call(this, size);
      case 2:
        return int_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  int_array.cljs$core$IFn$_invoke$arity$1 = int_array__1;
  int_array.cljs$core$IFn$_invoke$arity$2 = int_array__2;
  return int_array
}();
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return long_array.cljs$core$IFn$_invoke$arity$2(size_or_seq, null)
    }else {
      return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(size_or_seq)
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s = cljs.core.seq(init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first(s__$1);
          var G__4806 = i + 1;
          var G__4807 = cljs.core.next(s__$1);
          i = G__4806;
          s__$1 = G__4807;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3078__auto___4808 = size;
      var i_4809 = 0;
      while(true) {
        if(i_4809 < n__3078__auto___4808) {
          a[i_4809] = init_val_or_seq;
          var G__4810 = i_4809 + 1;
          i_4809 = G__4810;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$core$IFn$_invoke$arity$1 = long_array__1;
  long_array.cljs$core$IFn$_invoke$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return double_array.cljs$core$IFn$_invoke$arity$2(size_or_seq, null)
    }else {
      return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(size_or_seq)
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s = cljs.core.seq(init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first(s__$1);
          var G__4811 = i + 1;
          var G__4812 = cljs.core.next(s__$1);
          i = G__4811;
          s__$1 = G__4812;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3078__auto___4813 = size;
      var i_4814 = 0;
      while(true) {
        if(i_4814 < n__3078__auto___4813) {
          a[i_4814] = init_val_or_seq;
          var G__4815 = i_4814 + 1;
          i_4814 = G__4815;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$core$IFn$_invoke$arity$1 = double_array__1;
  double_array.cljs$core$IFn$_invoke$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(typeof size_or_seq === "number") {
      return object_array.cljs$core$IFn$_invoke$arity$2(size_or_seq, null)
    }else {
      return cljs.core.into_array.cljs$core$IFn$_invoke$arity$1(size_or_seq)
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = new Array(size);
    if(cljs.core.seq_QMARK_(init_val_or_seq)) {
      var s = cljs.core.seq(init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = s__$1;
          if(and__3941__auto__) {
            return i < size
          }else {
            return and__3941__auto__
          }
        }())) {
          a[i] = cljs.core.first(s__$1);
          var G__4816 = i + 1;
          var G__4817 = cljs.core.next(s__$1);
          i = G__4816;
          s__$1 = G__4817;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__3078__auto___4818 = size;
      var i_4819 = 0;
      while(true) {
        if(i_4819 < n__3078__auto___4818) {
          a[i_4819] = init_val_or_seq;
          var G__4820 = i_4819 + 1;
          i_4819 = G__4820;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$core$IFn$_invoke$arity$1 = object_array__1;
  object_array.cljs$core$IFn$_invoke$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_(s)) {
    return cljs.core.count(s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = i > 0;
        if(and__3941__auto__) {
          return cljs.core.seq(s__$1)
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4821 = cljs.core.next(s__$1);
        var G__4822 = i - 1;
        var G__4823 = sum + 1;
        s__$1 = G__4821;
        i = G__4822;
        sum = G__4823;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next(arglist) == null) {
      return cljs.core.seq(cljs.core.first(arglist))
    }else {
      if("\ufdd0:else") {
        return cljs.core.cons(cljs.core.first(arglist), spread(cljs.core.next(arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s = cljs.core.seq(x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_(s)) {
          return cljs.core.chunk_cons(cljs.core.chunk_first(s), concat.cljs$core$IFn$_invoke$arity$2(cljs.core.chunk_rest(s), y))
        }else {
          return cljs.core.cons(cljs.core.first(s), concat.cljs$core$IFn$_invoke$arity$2(cljs.core.rest(s), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__4824__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__$1 = cljs.core.seq(xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_(xys__$1)) {
              return cljs.core.chunk_cons(cljs.core.chunk_first(xys__$1), cat(cljs.core.chunk_rest(xys__$1), zs__$1))
            }else {
              return cljs.core.cons(cljs.core.first(xys__$1), cat(cljs.core.rest(xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat(cljs.core.first(zs__$1), cljs.core.next(zs__$1))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat(concat.cljs$core$IFn$_invoke$arity$2(x, y), zs)
    };
    var G__4824 = function(x, y, var_args) {
      var zs = null;
      if(arguments.length > 2) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4824__delegate.call(this, x, y, zs)
    };
    G__4824.cljs$lang$maxFixedArity = 2;
    G__4824.cljs$lang$applyTo = function(arglist__4825) {
      var x = cljs.core.first(arglist__4825);
      arglist__4825 = cljs.core.next(arglist__4825);
      var y = cljs.core.first(arglist__4825);
      var zs = cljs.core.rest(arglist__4825);
      return G__4824__delegate(x, y, zs)
    };
    G__4824.cljs$core$IFn$_invoke$arity$variadic = G__4824__delegate;
    return G__4824
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$core$IFn$_invoke$arity$0 = concat__0;
  concat.cljs$core$IFn$_invoke$arity$1 = concat__1;
  concat.cljs$core$IFn$_invoke$arity$2 = concat__2;
  concat.cljs$core$IFn$_invoke$arity$variadic = concat__3.cljs$core$IFn$_invoke$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq(args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons(a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons(a, cljs.core.cons(b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, args)))
  };
  var list_STAR___5 = function() {
    var G__4826__delegate = function(a, b, c, d, more) {
      return cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, cljs.core.cons(d, cljs.core.spread(more)))))
    };
    var G__4826 = function(a, b, c, d, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4826__delegate.call(this, a, b, c, d, more)
    };
    G__4826.cljs$lang$maxFixedArity = 4;
    G__4826.cljs$lang$applyTo = function(arglist__4827) {
      var a = cljs.core.first(arglist__4827);
      arglist__4827 = cljs.core.next(arglist__4827);
      var b = cljs.core.first(arglist__4827);
      arglist__4827 = cljs.core.next(arglist__4827);
      var c = cljs.core.first(arglist__4827);
      arglist__4827 = cljs.core.next(arglist__4827);
      var d = cljs.core.first(arglist__4827);
      var more = cljs.core.rest(arglist__4827);
      return G__4826__delegate(a, b, c, d, more)
    };
    G__4826.cljs$core$IFn$_invoke$arity$variadic = G__4826__delegate;
    return G__4826
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$core$IFn$_invoke$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$core$IFn$_invoke$arity$1 = list_STAR___1;
  list_STAR_.cljs$core$IFn$_invoke$arity$2 = list_STAR___2;
  list_STAR_.cljs$core$IFn$_invoke$arity$3 = list_STAR___3;
  list_STAR_.cljs$core$IFn$_invoke$arity$4 = list_STAR___4;
  list_STAR_.cljs$core$IFn$_invoke$arity$variadic = list_STAR___5.cljs$core$IFn$_invoke$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient(coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_(tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_(tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_(tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_(tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_(tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_(tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq(args);
  if(argc === 0) {
    return f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)
  }else {
    var a = cljs.core._first(args__$1);
    var args__$2 = cljs.core._rest(args__$1);
    if(argc === 1) {
      if(f.cljs$core$IFn$_invoke$arity$1) {
        return f.cljs$core$IFn$_invoke$arity$1(a)
      }else {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(a) : f.call(null, a)
      }
    }else {
      var b = cljs.core._first(args__$2);
      var args__$3 = cljs.core._rest(args__$2);
      if(argc === 2) {
        if(f.cljs$core$IFn$_invoke$arity$2) {
          return f.cljs$core$IFn$_invoke$arity$2(a, b)
        }else {
          return f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(a, b) : f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first(args__$3);
        var args__$4 = cljs.core._rest(args__$3);
        if(argc === 3) {
          if(f.cljs$core$IFn$_invoke$arity$3) {
            return f.cljs$core$IFn$_invoke$arity$3(a, b, c)
          }else {
            return f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(a, b, c) : f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first(args__$4);
          var args__$5 = cljs.core._rest(args__$4);
          if(argc === 4) {
            if(f.cljs$core$IFn$_invoke$arity$4) {
              return f.cljs$core$IFn$_invoke$arity$4(a, b, c, d)
            }else {
              return f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(a, b, c, d) : f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first(args__$5);
            var args__$6 = cljs.core._rest(args__$5);
            if(argc === 5) {
              if(f.cljs$core$IFn$_invoke$arity$5) {
                return f.cljs$core$IFn$_invoke$arity$5(a, b, c, d, e)
              }else {
                return f.cljs$core$IFn$_invoke$arity$5 ? f.cljs$core$IFn$_invoke$arity$5(a, b, c, d, e) : f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first(args__$6);
              var args__$7 = cljs.core._rest(args__$6);
              if(argc === 6) {
                if(f__$1.cljs$core$IFn$_invoke$arity$6) {
                  return f__$1.cljs$core$IFn$_invoke$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.cljs$core$IFn$_invoke$arity$6 ? f__$1.cljs$core$IFn$_invoke$arity$6(a, b, c, d, e, f__$1) : f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first(args__$7);
                var args__$8 = cljs.core._rest(args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$core$IFn$_invoke$arity$7) {
                    return f__$1.cljs$core$IFn$_invoke$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.cljs$core$IFn$_invoke$arity$7 ? f__$1.cljs$core$IFn$_invoke$arity$7(a, b, c, d, e, f__$1, g) : f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first(args__$8);
                  var args__$9 = cljs.core._rest(args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$core$IFn$_invoke$arity$8) {
                      return f__$1.cljs$core$IFn$_invoke$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.cljs$core$IFn$_invoke$arity$8 ? f__$1.cljs$core$IFn$_invoke$arity$8(a, b, c, d, e, f__$1, g, h) : f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first(args__$9);
                    var args__$10 = cljs.core._rest(args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$core$IFn$_invoke$arity$9) {
                        return f__$1.cljs$core$IFn$_invoke$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.cljs$core$IFn$_invoke$arity$9 ? f__$1.cljs$core$IFn$_invoke$arity$9(a, b, c, d, e, f__$1, g, h, i) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first(args__$10);
                      var args__$11 = cljs.core._rest(args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$core$IFn$_invoke$arity$10) {
                          return f__$1.cljs$core$IFn$_invoke$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.cljs$core$IFn$_invoke$arity$10 ? f__$1.cljs$core$IFn$_invoke$arity$10(a, b, c, d, e, f__$1, g, h, i, j) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first(args__$11);
                        var args__$12 = cljs.core._rest(args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$core$IFn$_invoke$arity$11) {
                            return f__$1.cljs$core$IFn$_invoke$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.cljs$core$IFn$_invoke$arity$11 ? f__$1.cljs$core$IFn$_invoke$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first(args__$12);
                          var args__$13 = cljs.core._rest(args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$core$IFn$_invoke$arity$12) {
                              return f__$1.cljs$core$IFn$_invoke$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.cljs$core$IFn$_invoke$arity$12 ? f__$1.cljs$core$IFn$_invoke$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first(args__$13);
                            var args__$14 = cljs.core._rest(args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$core$IFn$_invoke$arity$13) {
                                return f__$1.cljs$core$IFn$_invoke$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.cljs$core$IFn$_invoke$arity$13 ? f__$1.cljs$core$IFn$_invoke$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first(args__$14);
                              var args__$15 = cljs.core._rest(args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$core$IFn$_invoke$arity$14) {
                                  return f__$1.cljs$core$IFn$_invoke$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.cljs$core$IFn$_invoke$arity$14 ? f__$1.cljs$core$IFn$_invoke$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first(args__$15);
                                var args__$16 = cljs.core._rest(args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$core$IFn$_invoke$arity$15) {
                                    return f__$1.cljs$core$IFn$_invoke$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.cljs$core$IFn$_invoke$arity$15 ? f__$1.cljs$core$IFn$_invoke$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first(args__$16);
                                  var args__$17 = cljs.core._rest(args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$core$IFn$_invoke$arity$16) {
                                      return f__$1.cljs$core$IFn$_invoke$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.cljs$core$IFn$_invoke$arity$16 ? f__$1.cljs$core$IFn$_invoke$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first(args__$17);
                                    var args__$18 = cljs.core._rest(args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$core$IFn$_invoke$arity$17) {
                                        return f__$1.cljs$core$IFn$_invoke$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.cljs$core$IFn$_invoke$arity$17 ? f__$1.cljs$core$IFn$_invoke$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first(args__$18);
                                      var args__$19 = cljs.core._rest(args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$core$IFn$_invoke$arity$18) {
                                          return f__$1.cljs$core$IFn$_invoke$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.cljs$core$IFn$_invoke$arity$18 ? f__$1.cljs$core$IFn$_invoke$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first(args__$19);
                                        var args__$20 = cljs.core._rest(args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$core$IFn$_invoke$arity$19) {
                                            return f__$1.cljs$core$IFn$_invoke$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.cljs$core$IFn$_invoke$arity$19 ? f__$1.cljs$core$IFn$_invoke$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first(args__$20);
                                          var args__$21 = cljs.core._rest(args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$core$IFn$_invoke$arity$20) {
                                              return f__$1.cljs$core$IFn$_invoke$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.cljs$core$IFn$_invoke$arity$20 ? f__$1.cljs$core$IFn$_invoke$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t) : f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count(args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to(f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array(args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$2(x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count(arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to(f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$3(x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count(arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to(f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$4(x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count(arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to(f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array(arglist))
    }
  };
  var apply__6 = function() {
    var G__4828__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons(a, cljs.core.cons(b, cljs.core.cons(c, cljs.core.cons(d, cljs.core.spread(args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count(arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to(f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array(arglist))
      }
    };
    var G__4828 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(arguments.length > 5) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__4828__delegate.call(this, f, a, b, c, d, args)
    };
    G__4828.cljs$lang$maxFixedArity = 5;
    G__4828.cljs$lang$applyTo = function(arglist__4829) {
      var f = cljs.core.first(arglist__4829);
      arglist__4829 = cljs.core.next(arglist__4829);
      var a = cljs.core.first(arglist__4829);
      arglist__4829 = cljs.core.next(arglist__4829);
      var b = cljs.core.first(arglist__4829);
      arglist__4829 = cljs.core.next(arglist__4829);
      var c = cljs.core.first(arglist__4829);
      arglist__4829 = cljs.core.next(arglist__4829);
      var d = cljs.core.first(arglist__4829);
      var args = cljs.core.rest(arglist__4829);
      return G__4828__delegate(f, a, b, c, d, args)
    };
    G__4828.cljs$core$IFn$_invoke$arity$variadic = G__4828__delegate;
    return G__4828
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$core$IFn$_invoke$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$core$IFn$_invoke$arity$2 = apply__2;
  apply.cljs$core$IFn$_invoke$arity$3 = apply__3;
  apply.cljs$core$IFn$_invoke$arity$4 = apply__4;
  apply.cljs$core$IFn$_invoke$arity$5 = apply__5;
  apply.cljs$core$IFn$_invoke$arity$variadic = apply__6.cljs$core$IFn$_invoke$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta(obj, cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f, cljs.core.meta(obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__4830) {
    var obj = cljs.core.first(arglist__4830);
    arglist__4830 = cljs.core.next(arglist__4830);
    var f = cljs.core.first(arglist__4830);
    var args = cljs.core.rest(arglist__4830);
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$core$IFn$_invoke$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(x, y)
  };
  var not_EQ___3 = function() {
    var G__4831__delegate = function(x, y, more) {
      return cljs.core.not(cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core._EQ_, x, y, more))
    };
    var G__4831 = function(x, y, var_args) {
      var more = null;
      if(arguments.length > 2) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4831__delegate.call(this, x, y, more)
    };
    G__4831.cljs$lang$maxFixedArity = 2;
    G__4831.cljs$lang$applyTo = function(arglist__4832) {
      var x = cljs.core.first(arglist__4832);
      arglist__4832 = cljs.core.next(arglist__4832);
      var y = cljs.core.first(arglist__4832);
      var more = cljs.core.rest(arglist__4832);
      return G__4831__delegate(x, y, more)
    };
    G__4831.cljs$core$IFn$_invoke$arity$variadic = G__4831__delegate;
    return G__4831
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$core$IFn$_invoke$arity$1 = not_EQ___1;
  not_EQ_.cljs$core$IFn$_invoke$arity$2 = not_EQ___2;
  not_EQ_.cljs$core$IFn$_invoke$arity$variadic = not_EQ___3.cljs$core$IFn$_invoke$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq(coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq(coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(cljs.core.first(coll)) : pred.call(null, cljs.core.first(coll)))) {
        var G__4833 = pred;
        var G__4834 = cljs.core.next(coll);
        pred = G__4833;
        coll = G__4834;
        continue
      }else {
        if("\ufdd0:else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_(pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq(coll)) {
      var or__3943__auto__ = pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(cljs.core.first(coll)) : pred.call(null, cljs.core.first(coll));
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        var G__4835 = pred;
        var G__4836 = cljs.core.next(coll);
        pred = G__4835;
        coll = G__4836;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not(cljs.core.some(pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_(n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_(n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__4837 = null;
    var G__4837__0 = function() {
      return cljs.core.not(f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null))
    };
    var G__4837__1 = function(x) {
      return cljs.core.not(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null, x))
    };
    var G__4837__2 = function(x, y) {
      return cljs.core.not(f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(x, y) : f.call(null, x, y))
    };
    var G__4837__3 = function() {
      var G__4838__delegate = function(x, y, zs) {
        return cljs.core.not(cljs.core.apply.cljs$core$IFn$_invoke$arity$4(f, x, y, zs))
      };
      var G__4838 = function(x, y, var_args) {
        var zs = null;
        if(arguments.length > 2) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__4838__delegate.call(this, x, y, zs)
      };
      G__4838.cljs$lang$maxFixedArity = 2;
      G__4838.cljs$lang$applyTo = function(arglist__4839) {
        var x = cljs.core.first(arglist__4839);
        arglist__4839 = cljs.core.next(arglist__4839);
        var y = cljs.core.first(arglist__4839);
        var zs = cljs.core.rest(arglist__4839);
        return G__4838__delegate(x, y, zs)
      };
      G__4838.cljs$core$IFn$_invoke$arity$variadic = G__4838__delegate;
      return G__4838
    }();
    G__4837 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__4837__0.call(this);
        case 1:
          return G__4837__1.call(this, x);
        case 2:
          return G__4837__2.call(this, x, y);
        default:
          return G__4837__3.cljs$core$IFn$_invoke$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__4837.cljs$lang$maxFixedArity = 2;
    G__4837.cljs$lang$applyTo = G__4837__3.cljs$lang$applyTo;
    return G__4837
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__4840__delegate = function(args) {
      return x
    };
    var G__4840 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4840__delegate.call(this, args)
    };
    G__4840.cljs$lang$maxFixedArity = 0;
    G__4840.cljs$lang$applyTo = function(arglist__4841) {
      var args = cljs.core.seq(arglist__4841);
      return G__4840__delegate(args)
    };
    G__4840.cljs$core$IFn$_invoke$arity$variadic = G__4840__delegate;
    return G__4840
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__4842 = null;
      var G__4842__0 = function() {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$0 ? g.cljs$core$IFn$_invoke$arity$0() : g.call(null)) : f.call(null, g.cljs$core$IFn$_invoke$arity$0 ? g.cljs$core$IFn$_invoke$arity$0() : g.call(null))
      };
      var G__4842__1 = function(x) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(x) : g.call(null, x)) : f.call(null, g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(x) : g.call(null, x))
      };
      var G__4842__2 = function(x, y) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$2 ? g.cljs$core$IFn$_invoke$arity$2(x, y) : g.call(null, x, y)) : f.call(null, g.cljs$core$IFn$_invoke$arity$2 ? g.cljs$core$IFn$_invoke$arity$2(x, y) : g.call(null, x, y))
      };
      var G__4842__3 = function(x, y, z) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$3 ? g.cljs$core$IFn$_invoke$arity$3(x, y, z) : g.call(null, x, y, z)) : f.call(null, g.cljs$core$IFn$_invoke$arity$3 ? g.cljs$core$IFn$_invoke$arity$3(x, y, z) : g.call(null, x, y, z))
      };
      var G__4842__4 = function() {
        var G__4843__delegate = function(x, y, z, args) {
          return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$5(g, x, y, z, args)) : f.call(null, cljs.core.apply.cljs$core$IFn$_invoke$arity$5(g, x, y, z, args))
        };
        var G__4843 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4843__delegate.call(this, x, y, z, args)
        };
        G__4843.cljs$lang$maxFixedArity = 3;
        G__4843.cljs$lang$applyTo = function(arglist__4844) {
          var x = cljs.core.first(arglist__4844);
          arglist__4844 = cljs.core.next(arglist__4844);
          var y = cljs.core.first(arglist__4844);
          arglist__4844 = cljs.core.next(arglist__4844);
          var z = cljs.core.first(arglist__4844);
          var args = cljs.core.rest(arglist__4844);
          return G__4843__delegate(x, y, z, args)
        };
        G__4843.cljs$core$IFn$_invoke$arity$variadic = G__4843__delegate;
        return G__4843
      }();
      G__4842 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4842__0.call(this);
          case 1:
            return G__4842__1.call(this, x);
          case 2:
            return G__4842__2.call(this, x, y);
          case 3:
            return G__4842__3.call(this, x, y, z);
          default:
            return G__4842__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4842.cljs$lang$maxFixedArity = 3;
      G__4842.cljs$lang$applyTo = G__4842__4.cljs$lang$applyTo;
      return G__4842
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__4845 = null;
      var G__4845__0 = function() {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$0 ? h.cljs$core$IFn$_invoke$arity$0() : h.call(null)) : g.call(null, h.cljs$core$IFn$_invoke$arity$0 ? h.cljs$core$IFn$_invoke$arity$0() : h.call(null))) : f.call(null, g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$0 ? h.cljs$core$IFn$_invoke$arity$0() : h.call(null)) : g.call(null, 
        h.cljs$core$IFn$_invoke$arity$0 ? h.cljs$core$IFn$_invoke$arity$0() : h.call(null)))
      };
      var G__4845__1 = function(x) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$1 ? h.cljs$core$IFn$_invoke$arity$1(x) : h.call(null, x)) : g.call(null, h.cljs$core$IFn$_invoke$arity$1 ? h.cljs$core$IFn$_invoke$arity$1(x) : h.call(null, x))) : f.call(null, g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$1 ? h.cljs$core$IFn$_invoke$arity$1(x) : h.call(null, 
        x)) : g.call(null, h.cljs$core$IFn$_invoke$arity$1 ? h.cljs$core$IFn$_invoke$arity$1(x) : h.call(null, x)))
      };
      var G__4845__2 = function(x, y) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(x, y) : h.call(null, x, y)) : g.call(null, h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(x, y) : h.call(null, x, y))) : f.call(null, g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(x, 
        y) : h.call(null, x, y)) : g.call(null, h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(x, y) : h.call(null, x, y)))
      };
      var G__4845__3 = function(x, y, z) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$3 ? h.cljs$core$IFn$_invoke$arity$3(x, y, z) : h.call(null, x, y, z)) : g.call(null, h.cljs$core$IFn$_invoke$arity$3 ? h.cljs$core$IFn$_invoke$arity$3(x, y, z) : h.call(null, x, y, z))) : f.call(null, g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(h.cljs$core$IFn$_invoke$arity$3 ? h.cljs$core$IFn$_invoke$arity$3(x, 
        y, z) : h.call(null, x, y, z)) : g.call(null, h.cljs$core$IFn$_invoke$arity$3 ? h.cljs$core$IFn$_invoke$arity$3(x, y, z) : h.call(null, x, y, z)))
      };
      var G__4845__4 = function() {
        var G__4846__delegate = function(x, y, z, args) {
          return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$5(h, x, y, z, args)) : g.call(null, cljs.core.apply.cljs$core$IFn$_invoke$arity$5(h, x, y, z, args))) : f.call(null, g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(cljs.core.apply.cljs$core$IFn$_invoke$arity$5(h, x, y, z, args)) : g.call(null, cljs.core.apply.cljs$core$IFn$_invoke$arity$5(h, 
          x, y, z, args)))
        };
        var G__4846 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4846__delegate.call(this, x, y, z, args)
        };
        G__4846.cljs$lang$maxFixedArity = 3;
        G__4846.cljs$lang$applyTo = function(arglist__4847) {
          var x = cljs.core.first(arglist__4847);
          arglist__4847 = cljs.core.next(arglist__4847);
          var y = cljs.core.first(arglist__4847);
          arglist__4847 = cljs.core.next(arglist__4847);
          var z = cljs.core.first(arglist__4847);
          var args = cljs.core.rest(arglist__4847);
          return G__4846__delegate(x, y, z, args)
        };
        G__4846.cljs$core$IFn$_invoke$arity$variadic = G__4846__delegate;
        return G__4846
      }();
      G__4845 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__4845__0.call(this);
          case 1:
            return G__4845__1.call(this, x);
          case 2:
            return G__4845__2.call(this, x, y);
          case 3:
            return G__4845__3.call(this, x, y, z);
          default:
            return G__4845__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4845.cljs$lang$maxFixedArity = 3;
      G__4845.cljs$lang$applyTo = G__4845__4.cljs$lang$applyTo;
      return G__4845
    }()
  };
  var comp__4 = function() {
    var G__4848__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse(cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$4(f1, f2, f3, fs));
      return function() {
        var G__4849__delegate = function(args) {
          var ret = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.first(fs__$1), args);
          var fs__$2 = cljs.core.next(fs__$1);
          while(true) {
            if(fs__$2) {
              var G__4850 = cljs.core.first(fs__$2).call(null, ret);
              var G__4851 = cljs.core.next(fs__$2);
              ret = G__4850;
              fs__$2 = G__4851;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__4849 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4849__delegate.call(this, args)
        };
        G__4849.cljs$lang$maxFixedArity = 0;
        G__4849.cljs$lang$applyTo = function(arglist__4852) {
          var args = cljs.core.seq(arglist__4852);
          return G__4849__delegate(args)
        };
        G__4849.cljs$core$IFn$_invoke$arity$variadic = G__4849__delegate;
        return G__4849
      }()
    };
    var G__4848 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4848__delegate.call(this, f1, f2, f3, fs)
    };
    G__4848.cljs$lang$maxFixedArity = 3;
    G__4848.cljs$lang$applyTo = function(arglist__4853) {
      var f1 = cljs.core.first(arglist__4853);
      arglist__4853 = cljs.core.next(arglist__4853);
      var f2 = cljs.core.first(arglist__4853);
      arglist__4853 = cljs.core.next(arglist__4853);
      var f3 = cljs.core.first(arglist__4853);
      var fs = cljs.core.rest(arglist__4853);
      return G__4848__delegate(f1, f2, f3, fs)
    };
    G__4848.cljs$core$IFn$_invoke$arity$variadic = G__4848__delegate;
    return G__4848
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$core$IFn$_invoke$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$core$IFn$_invoke$arity$0 = comp__0;
  comp.cljs$core$IFn$_invoke$arity$1 = comp__1;
  comp.cljs$core$IFn$_invoke$arity$2 = comp__2;
  comp.cljs$core$IFn$_invoke$arity$3 = comp__3;
  comp.cljs$core$IFn$_invoke$arity$variadic = comp__4.cljs$core$IFn$_invoke$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__4854__delegate = function(args) {
        return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f, arg1, args)
      };
      var G__4854 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4854__delegate.call(this, args)
      };
      G__4854.cljs$lang$maxFixedArity = 0;
      G__4854.cljs$lang$applyTo = function(arglist__4855) {
        var args = cljs.core.seq(arglist__4855);
        return G__4854__delegate(args)
      };
      G__4854.cljs$core$IFn$_invoke$arity$variadic = G__4854__delegate;
      return G__4854
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__4856__delegate = function(args) {
        return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(f, arg1, arg2, args)
      };
      var G__4856 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4856__delegate.call(this, args)
      };
      G__4856.cljs$lang$maxFixedArity = 0;
      G__4856.cljs$lang$applyTo = function(arglist__4857) {
        var args = cljs.core.seq(arglist__4857);
        return G__4856__delegate(args)
      };
      G__4856.cljs$core$IFn$_invoke$arity$variadic = G__4856__delegate;
      return G__4856
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__4858__delegate = function(args) {
        return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, arg1, arg2, arg3, args)
      };
      var G__4858 = function(var_args) {
        var args = null;
        if(arguments.length > 0) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__4858__delegate.call(this, args)
      };
      G__4858.cljs$lang$maxFixedArity = 0;
      G__4858.cljs$lang$applyTo = function(arglist__4859) {
        var args = cljs.core.seq(arglist__4859);
        return G__4858__delegate(args)
      };
      G__4858.cljs$core$IFn$_invoke$arity$variadic = G__4858__delegate;
      return G__4858
    }()
  };
  var partial__5 = function() {
    var G__4860__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__4861__delegate = function(args) {
          return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, arg1, arg2, arg3, cljs.core.concat.cljs$core$IFn$_invoke$arity$2(more, args))
        };
        var G__4861 = function(var_args) {
          var args = null;
          if(arguments.length > 0) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4861__delegate.call(this, args)
        };
        G__4861.cljs$lang$maxFixedArity = 0;
        G__4861.cljs$lang$applyTo = function(arglist__4862) {
          var args = cljs.core.seq(arglist__4862);
          return G__4861__delegate(args)
        };
        G__4861.cljs$core$IFn$_invoke$arity$variadic = G__4861__delegate;
        return G__4861
      }()
    };
    var G__4860 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(arguments.length > 4) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4860__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__4860.cljs$lang$maxFixedArity = 4;
    G__4860.cljs$lang$applyTo = function(arglist__4863) {
      var f = cljs.core.first(arglist__4863);
      arglist__4863 = cljs.core.next(arglist__4863);
      var arg1 = cljs.core.first(arglist__4863);
      arglist__4863 = cljs.core.next(arglist__4863);
      var arg2 = cljs.core.first(arglist__4863);
      arglist__4863 = cljs.core.next(arglist__4863);
      var arg3 = cljs.core.first(arglist__4863);
      var more = cljs.core.rest(arglist__4863);
      return G__4860__delegate(f, arg1, arg2, arg3, more)
    };
    G__4860.cljs$core$IFn$_invoke$arity$variadic = G__4860__delegate;
    return G__4860
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$core$IFn$_invoke$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$core$IFn$_invoke$arity$2 = partial__2;
  partial.cljs$core$IFn$_invoke$arity$3 = partial__3;
  partial.cljs$core$IFn$_invoke$arity$4 = partial__4;
  partial.cljs$core$IFn$_invoke$arity$variadic = partial__5.cljs$core$IFn$_invoke$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__4864 = null;
      var G__4864__1 = function(a) {
        return f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(a == null ? x : a) : f.call(null, a == null ? x : a)
      };
      var G__4864__2 = function(a, b) {
        return f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(a == null ? x : a, b) : f.call(null, a == null ? x : a, b)
      };
      var G__4864__3 = function(a, b, c) {
        return f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(a == null ? x : a, b, c) : f.call(null, a == null ? x : a, b, c)
      };
      var G__4864__4 = function() {
        var G__4865__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, a == null ? x : a, b, c, ds)
        };
        var G__4865 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4865__delegate.call(this, a, b, c, ds)
        };
        G__4865.cljs$lang$maxFixedArity = 3;
        G__4865.cljs$lang$applyTo = function(arglist__4866) {
          var a = cljs.core.first(arglist__4866);
          arglist__4866 = cljs.core.next(arglist__4866);
          var b = cljs.core.first(arglist__4866);
          arglist__4866 = cljs.core.next(arglist__4866);
          var c = cljs.core.first(arglist__4866);
          var ds = cljs.core.rest(arglist__4866);
          return G__4865__delegate(a, b, c, ds)
        };
        G__4865.cljs$core$IFn$_invoke$arity$variadic = G__4865__delegate;
        return G__4865
      }();
      G__4864 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__4864__1.call(this, a);
          case 2:
            return G__4864__2.call(this, a, b);
          case 3:
            return G__4864__3.call(this, a, b, c);
          default:
            return G__4864__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4864.cljs$lang$maxFixedArity = 3;
      G__4864.cljs$lang$applyTo = G__4864__4.cljs$lang$applyTo;
      return G__4864
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__4867 = null;
      var G__4867__2 = function(a, b) {
        return f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(a == null ? x : a, b == null ? y : b) : f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__4867__3 = function(a, b, c) {
        return f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(a == null ? x : a, b == null ? y : b, c) : f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__4867__4 = function() {
        var G__4868__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__4868 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4868__delegate.call(this, a, b, c, ds)
        };
        G__4868.cljs$lang$maxFixedArity = 3;
        G__4868.cljs$lang$applyTo = function(arglist__4869) {
          var a = cljs.core.first(arglist__4869);
          arglist__4869 = cljs.core.next(arglist__4869);
          var b = cljs.core.first(arglist__4869);
          arglist__4869 = cljs.core.next(arglist__4869);
          var c = cljs.core.first(arglist__4869);
          var ds = cljs.core.rest(arglist__4869);
          return G__4868__delegate(a, b, c, ds)
        };
        G__4868.cljs$core$IFn$_invoke$arity$variadic = G__4868__delegate;
        return G__4868
      }();
      G__4867 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__4867__2.call(this, a, b);
          case 3:
            return G__4867__3.call(this, a, b, c);
          default:
            return G__4867__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4867.cljs$lang$maxFixedArity = 3;
      G__4867.cljs$lang$applyTo = G__4867__4.cljs$lang$applyTo;
      return G__4867
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__4870 = null;
      var G__4870__2 = function(a, b) {
        return f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(a == null ? x : a, b == null ? y : b) : f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__4870__3 = function(a, b, c) {
        return f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(a == null ? x : a, b == null ? y : b, c == null ? z : c) : f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__4870__4 = function() {
        var G__4871__delegate = function(a, b, c, ds) {
          return cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__4871 = function(a, b, c, var_args) {
          var ds = null;
          if(arguments.length > 3) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4871__delegate.call(this, a, b, c, ds)
        };
        G__4871.cljs$lang$maxFixedArity = 3;
        G__4871.cljs$lang$applyTo = function(arglist__4872) {
          var a = cljs.core.first(arglist__4872);
          arglist__4872 = cljs.core.next(arglist__4872);
          var b = cljs.core.first(arglist__4872);
          arglist__4872 = cljs.core.next(arglist__4872);
          var c = cljs.core.first(arglist__4872);
          var ds = cljs.core.rest(arglist__4872);
          return G__4871__delegate(a, b, c, ds)
        };
        G__4871.cljs$core$IFn$_invoke$arity$variadic = G__4871__delegate;
        return G__4871
      }();
      G__4870 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__4870__2.call(this, a, b);
          case 3:
            return G__4870__3.call(this, a, b, c);
          default:
            return G__4870__4.cljs$core$IFn$_invoke$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__4870.cljs$lang$maxFixedArity = 3;
      G__4870.cljs$lang$applyTo = G__4870__4.cljs$lang$applyTo;
      return G__4870
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$core$IFn$_invoke$arity$2 = fnil__2;
  fnil.cljs$core$IFn$_invoke$arity$3 = fnil__3;
  fnil.cljs$core$IFn$_invoke$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_(s)) {
          var c = cljs.core.chunk_first(s);
          var size = cljs.core.count(c);
          var b = cljs.core.chunk_buffer(size);
          var n__3078__auto___4873 = size;
          var i_4874 = 0;
          while(true) {
            if(i_4874 < n__3078__auto___4873) {
              cljs.core.chunk_append(b, f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(idx + i_4874, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4874)) : f.call(null, idx + i_4874, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4874)));
              var G__4875 = i_4874 + 1;
              i_4874 = G__4875;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b), mapi(idx + size, cljs.core.chunk_rest(s)))
        }else {
          return cljs.core.cons(f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(idx, cljs.core.first(s)) : f.call(null, idx, cljs.core.first(s)), mapi(idx + 1, cljs.core.rest(s)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi.cljs$core$IFn$_invoke$arity$2 ? mapi.cljs$core$IFn$_invoke$arity$2(0, coll) : mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq(coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_(s)) {
        var c = cljs.core.chunk_first(s);
        var size = cljs.core.count(c);
        var b = cljs.core.chunk_buffer(size);
        var n__3078__auto___4876 = size;
        var i_4877 = 0;
        while(true) {
          if(i_4877 < n__3078__auto___4876) {
            var x_4878 = f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4877)) : f.call(null, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4877));
            if(x_4878 == null) {
            }else {
              cljs.core.chunk_append(b, x_4878)
            }
            var G__4879 = i_4877 + 1;
            i_4877 = G__4879;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons(cljs.core.chunk(b), keep(f, cljs.core.chunk_rest(s)))
      }else {
        var x = f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core.first(s)) : f.call(null, cljs.core.first(s));
        if(x == null) {
          return keep(f, cljs.core.rest(s))
        }else {
          return cljs.core.cons(x, keep(f, cljs.core.rest(s)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll__$1);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_(s)) {
          var c = cljs.core.chunk_first(s);
          var size = cljs.core.count(c);
          var b = cljs.core.chunk_buffer(size);
          var n__3078__auto___4880 = size;
          var i_4881 = 0;
          while(true) {
            if(i_4881 < n__3078__auto___4880) {
              var x_4882 = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(idx + i_4881, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4881)) : f.call(null, idx + i_4881, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4881));
              if(x_4882 == null) {
              }else {
                cljs.core.chunk_append(b, x_4882)
              }
              var G__4883 = i_4881 + 1;
              i_4881 = G__4883;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b), keepi(idx + size, cljs.core.chunk_rest(s)))
        }else {
          var x = f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(idx, cljs.core.first(s)) : f.call(null, idx, cljs.core.first(s));
          if(x == null) {
            return keepi(idx + 1, cljs.core.rest(s))
          }else {
            return cljs.core.cons(x, keepi(idx + 1, cljs.core.rest(s)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi.cljs$core$IFn$_invoke$arity$2 ? keepi.cljs$core$IFn$_invoke$arity$2(0, coll) : keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$(p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(y) : p.call(null, y)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(y) : p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(z) : p.call(null, z)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__4890__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3941__auto__ = ep1.cljs$core$IFn$_invoke$arity$3(x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_(p, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__4890 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4890__delegate.call(this, x, y, z, args)
        };
        G__4890.cljs$lang$maxFixedArity = 3;
        G__4890.cljs$lang$applyTo = function(arglist__4891) {
          var x = cljs.core.first(arglist__4891);
          arglist__4891 = cljs.core.next(arglist__4891);
          var y = cljs.core.first(arglist__4891);
          arglist__4891 = cljs.core.next(arglist__4891);
          var z = cljs.core.first(arglist__4891);
          var args = cljs.core.rest(arglist__4891);
          return G__4890__delegate(x, y, z, args)
        };
        G__4890.cljs$core$IFn$_invoke$arity$variadic = G__4890__delegate;
        return G__4890
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$core$IFn$_invoke$arity$0 = ep1__0;
      ep1.cljs$core$IFn$_invoke$arity$1 = ep1__1;
      ep1.cljs$core$IFn$_invoke$arity$2 = ep1__2;
      ep1.cljs$core$IFn$_invoke$arity$3 = ep1__3;
      ep1.cljs$core$IFn$_invoke$arity$variadic = ep1__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x)
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y)
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(z) : p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(z) : p2.call(null, z)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__4892__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3941__auto__ = ep2.cljs$core$IFn$_invoke$arity$3(x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_(function(p1__4884_SHARP_) {
                var and__3941__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(p1__4884_SHARP_) : p1.call(null, p1__4884_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(p1__4884_SHARP_) : p2.call(null, p1__4884_SHARP_)
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__4892 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4892__delegate.call(this, x, y, z, args)
        };
        G__4892.cljs$lang$maxFixedArity = 3;
        G__4892.cljs$lang$applyTo = function(arglist__4893) {
          var x = cljs.core.first(arglist__4893);
          arglist__4893 = cljs.core.next(arglist__4893);
          var y = cljs.core.first(arglist__4893);
          arglist__4893 = cljs.core.next(arglist__4893);
          var z = cljs.core.first(arglist__4893);
          var args = cljs.core.rest(arglist__4893);
          return G__4892__delegate(x, y, z, args)
        };
        G__4892.cljs$core$IFn$_invoke$arity$variadic = G__4892__delegate;
        return G__4892
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$core$IFn$_invoke$arity$0 = ep2__0;
      ep2.cljs$core$IFn$_invoke$arity$1 = ep2__1;
      ep2.cljs$core$IFn$_invoke$arity$2 = ep2__2;
      ep2.cljs$core$IFn$_invoke$arity$3 = ep2__3;
      ep2.cljs$core$IFn$_invoke$arity$variadic = ep2__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(x) : p3.call(null, x)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(x) : p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(y) : p3.call(null, y)
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$(function() {
          var and__3941__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____$1)) {
              var and__3941__auto____$2 = p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(x) : p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____$2)) {
                var and__3941__auto____$3 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____$3)) {
                  var and__3941__auto____$4 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____$4)) {
                    var and__3941__auto____$5 = p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(y) : p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____$5)) {
                      var and__3941__auto____$6 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(z) : p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____$6)) {
                        var and__3941__auto____$7 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(z) : p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____$7)) {
                          return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(z) : p3.call(null, z)
                        }else {
                          return and__3941__auto____$7
                        }
                      }else {
                        return and__3941__auto____$6
                      }
                    }else {
                      return and__3941__auto____$5
                    }
                  }else {
                    return and__3941__auto____$4
                  }
                }else {
                  return and__3941__auto____$3
                }
              }else {
                return and__3941__auto____$2
              }
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__4894__delegate = function(x, y, z, args) {
          return cljs.core.boolean$(function() {
            var and__3941__auto__ = ep3.cljs$core$IFn$_invoke$arity$3(x, y, z);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.every_QMARK_(function(p1__4885_SHARP_) {
                var and__3941__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(p1__4885_SHARP_) : p1.call(null, p1__4885_SHARP_);
                if(cljs.core.truth_(and__3941__auto____$1)) {
                  var and__3941__auto____$2 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(p1__4885_SHARP_) : p2.call(null, p1__4885_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____$2)) {
                    return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(p1__4885_SHARP_) : p3.call(null, p1__4885_SHARP_)
                  }else {
                    return and__3941__auto____$2
                  }
                }else {
                  return and__3941__auto____$1
                }
              }, args)
            }else {
              return and__3941__auto__
            }
          }())
        };
        var G__4894 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4894__delegate.call(this, x, y, z, args)
        };
        G__4894.cljs$lang$maxFixedArity = 3;
        G__4894.cljs$lang$applyTo = function(arglist__4895) {
          var x = cljs.core.first(arglist__4895);
          arglist__4895 = cljs.core.next(arglist__4895);
          var y = cljs.core.first(arglist__4895);
          arglist__4895 = cljs.core.next(arglist__4895);
          var z = cljs.core.first(arglist__4895);
          var args = cljs.core.rest(arglist__4895);
          return G__4894__delegate(x, y, z, args)
        };
        G__4894.cljs$core$IFn$_invoke$arity$variadic = G__4894__delegate;
        return G__4894
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$core$IFn$_invoke$arity$0 = ep3__0;
      ep3.cljs$core$IFn$_invoke$arity$1 = ep3__1;
      ep3.cljs$core$IFn$_invoke$arity$2 = ep3__2;
      ep3.cljs$core$IFn$_invoke$arity$3 = ep3__3;
      ep3.cljs$core$IFn$_invoke$arity$variadic = ep3__4.cljs$core$IFn$_invoke$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__4896__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$4(p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_(function(p1__4886_SHARP_) {
            return p1__4886_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4886_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__4886_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_(function(p1__4887_SHARP_) {
            var and__3941__auto__ = p1__4887_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4887_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__4887_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              return p1__4887_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4887_SHARP_.cljs$core$IFn$_invoke$arity$1(y) : p1__4887_SHARP_.call(null, y)
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_(function(p1__4888_SHARP_) {
            var and__3941__auto__ = p1__4888_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4888_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__4888_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto__)) {
              var and__3941__auto____$1 = p1__4888_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4888_SHARP_.cljs$core$IFn$_invoke$arity$1(y) : p1__4888_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____$1)) {
                return p1__4888_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4888_SHARP_.cljs$core$IFn$_invoke$arity$1(z) : p1__4888_SHARP_.call(null, z)
              }else {
                return and__3941__auto____$1
              }
            }else {
              return and__3941__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__4897__delegate = function(x, y, z, args) {
            return cljs.core.boolean$(function() {
              var and__3941__auto__ = epn.cljs$core$IFn$_invoke$arity$3(x, y, z);
              if(cljs.core.truth_(and__3941__auto__)) {
                return cljs.core.every_QMARK_(function(p1__4889_SHARP_) {
                  return cljs.core.every_QMARK_(p1__4889_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3941__auto__
              }
            }())
          };
          var G__4897 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4897__delegate.call(this, x, y, z, args)
          };
          G__4897.cljs$lang$maxFixedArity = 3;
          G__4897.cljs$lang$applyTo = function(arglist__4898) {
            var x = cljs.core.first(arglist__4898);
            arglist__4898 = cljs.core.next(arglist__4898);
            var y = cljs.core.first(arglist__4898);
            arglist__4898 = cljs.core.next(arglist__4898);
            var z = cljs.core.first(arglist__4898);
            var args = cljs.core.rest(arglist__4898);
            return G__4897__delegate(x, y, z, args)
          };
          G__4897.cljs$core$IFn$_invoke$arity$variadic = G__4897__delegate;
          return G__4897
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$core$IFn$_invoke$arity$0 = epn__0;
        epn.cljs$core$IFn$_invoke$arity$1 = epn__1;
        epn.cljs$core$IFn$_invoke$arity$2 = epn__2;
        epn.cljs$core$IFn$_invoke$arity$3 = epn__3;
        epn.cljs$core$IFn$_invoke$arity$variadic = epn__4.cljs$core$IFn$_invoke$arity$variadic;
        return epn
      }()
    };
    var G__4896 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4896__delegate.call(this, p1, p2, p3, ps)
    };
    G__4896.cljs$lang$maxFixedArity = 3;
    G__4896.cljs$lang$applyTo = function(arglist__4899) {
      var p1 = cljs.core.first(arglist__4899);
      arglist__4899 = cljs.core.next(arglist__4899);
      var p2 = cljs.core.first(arglist__4899);
      arglist__4899 = cljs.core.next(arglist__4899);
      var p3 = cljs.core.first(arglist__4899);
      var ps = cljs.core.rest(arglist__4899);
      return G__4896__delegate(p1, p2, p3, ps)
    };
    G__4896.cljs$core$IFn$_invoke$arity$variadic = G__4896__delegate;
    return G__4896
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$core$IFn$_invoke$arity$1 = every_pred__1;
  every_pred.cljs$core$IFn$_invoke$arity$2 = every_pred__2;
  every_pred.cljs$core$IFn$_invoke$arity$3 = every_pred__3;
  every_pred.cljs$core$IFn$_invoke$arity$variadic = every_pred__4.cljs$core$IFn$_invoke$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto__ = p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(y) : p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto__ = p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(x) : p.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(y) : p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p.cljs$core$IFn$_invoke$arity$1 ? p.cljs$core$IFn$_invoke$arity$1(z) : p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__4906__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp1.cljs$core$IFn$_invoke$arity$3(x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some(p, args)
          }
        };
        var G__4906 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4906__delegate.call(this, x, y, z, args)
        };
        G__4906.cljs$lang$maxFixedArity = 3;
        G__4906.cljs$lang$applyTo = function(arglist__4907) {
          var x = cljs.core.first(arglist__4907);
          arglist__4907 = cljs.core.next(arglist__4907);
          var y = cljs.core.first(arglist__4907);
          arglist__4907 = cljs.core.next(arglist__4907);
          var z = cljs.core.first(arglist__4907);
          var args = cljs.core.rest(arglist__4907);
          return G__4906__delegate(x, y, z, args)
        };
        G__4906.cljs$core$IFn$_invoke$arity$variadic = G__4906__delegate;
        return G__4906
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$core$IFn$_invoke$arity$0 = sp1__0;
      sp1.cljs$core$IFn$_invoke$arity$1 = sp1__1;
      sp1.cljs$core$IFn$_invoke$arity$2 = sp1__2;
      sp1.cljs$core$IFn$_invoke$arity$3 = sp1__3;
      sp1.cljs$core$IFn$_invoke$arity$variadic = sp1__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(z) : p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(z) : p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__4908__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp2.cljs$core$IFn$_invoke$arity$3(x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some(function(p1__4900_SHARP_) {
              var or__3943__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(p1__4900_SHARP_) : p1.call(null, p1__4900_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(p1__4900_SHARP_) : p2.call(null, p1__4900_SHARP_)
              }
            }, args)
          }
        };
        var G__4908 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4908__delegate.call(this, x, y, z, args)
        };
        G__4908.cljs$lang$maxFixedArity = 3;
        G__4908.cljs$lang$applyTo = function(arglist__4909) {
          var x = cljs.core.first(arglist__4909);
          arglist__4909 = cljs.core.next(arglist__4909);
          var y = cljs.core.first(arglist__4909);
          arglist__4909 = cljs.core.next(arglist__4909);
          var z = cljs.core.first(arglist__4909);
          var args = cljs.core.rest(arglist__4909);
          return G__4908__delegate(x, y, z, args)
        };
        G__4908.cljs$core$IFn$_invoke$arity$variadic = G__4908__delegate;
        return G__4908
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$core$IFn$_invoke$arity$0 = sp2__0;
      sp2.cljs$core$IFn$_invoke$arity$1 = sp2__1;
      sp2.cljs$core$IFn$_invoke$arity$2 = sp2__2;
      sp2.cljs$core$IFn$_invoke$arity$3 = sp2__3;
      sp2.cljs$core$IFn$_invoke$arity$variadic = sp2__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(x) : p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(x) : p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(y) : p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto__ = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(x) : p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(x) : p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____$1)) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(x) : p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____$2)) {
              return or__3943__auto____$2
            }else {
              var or__3943__auto____$3 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(y) : p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$3)) {
                return or__3943__auto____$3
              }else {
                var or__3943__auto____$4 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(y) : p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____$4)) {
                  return or__3943__auto____$4
                }else {
                  var or__3943__auto____$5 = p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(y) : p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____$5)) {
                    return or__3943__auto____$5
                  }else {
                    var or__3943__auto____$6 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(z) : p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____$6)) {
                      return or__3943__auto____$6
                    }else {
                      var or__3943__auto____$7 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(z) : p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____$7)) {
                        return or__3943__auto____$7
                      }else {
                        return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(z) : p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__4910__delegate = function(x, y, z, args) {
          var or__3943__auto__ = sp3.cljs$core$IFn$_invoke$arity$3(x, y, z);
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.some(function(p1__4901_SHARP_) {
              var or__3943__auto____$1 = p1.cljs$core$IFn$_invoke$arity$1 ? p1.cljs$core$IFn$_invoke$arity$1(p1__4901_SHARP_) : p1.call(null, p1__4901_SHARP_);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                var or__3943__auto____$2 = p2.cljs$core$IFn$_invoke$arity$1 ? p2.cljs$core$IFn$_invoke$arity$1(p1__4901_SHARP_) : p2.call(null, p1__4901_SHARP_);
                if(cljs.core.truth_(or__3943__auto____$2)) {
                  return or__3943__auto____$2
                }else {
                  return p3.cljs$core$IFn$_invoke$arity$1 ? p3.cljs$core$IFn$_invoke$arity$1(p1__4901_SHARP_) : p3.call(null, p1__4901_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__4910 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__4910__delegate.call(this, x, y, z, args)
        };
        G__4910.cljs$lang$maxFixedArity = 3;
        G__4910.cljs$lang$applyTo = function(arglist__4911) {
          var x = cljs.core.first(arglist__4911);
          arglist__4911 = cljs.core.next(arglist__4911);
          var y = cljs.core.first(arglist__4911);
          arglist__4911 = cljs.core.next(arglist__4911);
          var z = cljs.core.first(arglist__4911);
          var args = cljs.core.rest(arglist__4911);
          return G__4910__delegate(x, y, z, args)
        };
        G__4910.cljs$core$IFn$_invoke$arity$variadic = G__4910__delegate;
        return G__4910
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$core$IFn$_invoke$arity$0 = sp3__0;
      sp3.cljs$core$IFn$_invoke$arity$1 = sp3__1;
      sp3.cljs$core$IFn$_invoke$arity$2 = sp3__2;
      sp3.cljs$core$IFn$_invoke$arity$3 = sp3__3;
      sp3.cljs$core$IFn$_invoke$arity$variadic = sp3__4.cljs$core$IFn$_invoke$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__4912__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$4(p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some(function(p1__4902_SHARP_) {
            return p1__4902_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4902_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__4902_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some(function(p1__4903_SHARP_) {
            var or__3943__auto__ = p1__4903_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4903_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__4903_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return p1__4903_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4903_SHARP_.cljs$core$IFn$_invoke$arity$1(y) : p1__4903_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some(function(p1__4904_SHARP_) {
            var or__3943__auto__ = p1__4904_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4904_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p1__4904_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              var or__3943__auto____$1 = p1__4904_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4904_SHARP_.cljs$core$IFn$_invoke$arity$1(y) : p1__4904_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____$1)) {
                return or__3943__auto____$1
              }else {
                return p1__4904_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p1__4904_SHARP_.cljs$core$IFn$_invoke$arity$1(z) : p1__4904_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__4913__delegate = function(x, y, z, args) {
            var or__3943__auto__ = spn.cljs$core$IFn$_invoke$arity$3(x, y, z);
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.some(function(p1__4905_SHARP_) {
                return cljs.core.some(p1__4905_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__4913 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__4913__delegate.call(this, x, y, z, args)
          };
          G__4913.cljs$lang$maxFixedArity = 3;
          G__4913.cljs$lang$applyTo = function(arglist__4914) {
            var x = cljs.core.first(arglist__4914);
            arglist__4914 = cljs.core.next(arglist__4914);
            var y = cljs.core.first(arglist__4914);
            arglist__4914 = cljs.core.next(arglist__4914);
            var z = cljs.core.first(arglist__4914);
            var args = cljs.core.rest(arglist__4914);
            return G__4913__delegate(x, y, z, args)
          };
          G__4913.cljs$core$IFn$_invoke$arity$variadic = G__4913__delegate;
          return G__4913
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$core$IFn$_invoke$arity$0 = spn__0;
        spn.cljs$core$IFn$_invoke$arity$1 = spn__1;
        spn.cljs$core$IFn$_invoke$arity$2 = spn__2;
        spn.cljs$core$IFn$_invoke$arity$3 = spn__3;
        spn.cljs$core$IFn$_invoke$arity$variadic = spn__4.cljs$core$IFn$_invoke$arity$variadic;
        return spn
      }()
    };
    var G__4912 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(arguments.length > 3) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4912__delegate.call(this, p1, p2, p3, ps)
    };
    G__4912.cljs$lang$maxFixedArity = 3;
    G__4912.cljs$lang$applyTo = function(arglist__4915) {
      var p1 = cljs.core.first(arglist__4915);
      arglist__4915 = cljs.core.next(arglist__4915);
      var p2 = cljs.core.first(arglist__4915);
      arglist__4915 = cljs.core.next(arglist__4915);
      var p3 = cljs.core.first(arglist__4915);
      var ps = cljs.core.rest(arglist__4915);
      return G__4912__delegate(p1, p2, p3, ps)
    };
    G__4912.cljs$core$IFn$_invoke$arity$variadic = G__4912__delegate;
    return G__4912
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$core$IFn$_invoke$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$core$IFn$_invoke$arity$1 = some_fn__1;
  some_fn.cljs$core$IFn$_invoke$arity$2 = some_fn__2;
  some_fn.cljs$core$IFn$_invoke$arity$3 = some_fn__3;
  some_fn.cljs$core$IFn$_invoke$arity$variadic = some_fn__4.cljs$core$IFn$_invoke$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_(s)) {
          var c = cljs.core.chunk_first(s);
          var size = cljs.core.count(c);
          var b = cljs.core.chunk_buffer(size);
          var n__3078__auto___4917 = size;
          var i_4918 = 0;
          while(true) {
            if(i_4918 < n__3078__auto___4917) {
              cljs.core.chunk_append(b, f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4918)) : f.call(null, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4918)));
              var G__4919 = i_4918 + 1;
              i_4918 = G__4919;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons(cljs.core.chunk(b), map.cljs$core$IFn$_invoke$arity$2(f, cljs.core.chunk_rest(s)))
        }else {
          return cljs.core.cons(f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core.first(s)) : f.call(null, cljs.core.first(s)), map.cljs$core$IFn$_invoke$arity$2(f, cljs.core.rest(s)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq(c1);
      var s2 = cljs.core.seq(c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons(f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(cljs.core.first(s1), cljs.core.first(s2)) : f.call(null, cljs.core.first(s1), cljs.core.first(s2)), map.cljs$core$IFn$_invoke$arity$3(f, cljs.core.rest(s1), cljs.core.rest(s2)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq(c1);
      var s2 = cljs.core.seq(c2);
      var s3 = cljs.core.seq(c3);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          var and__3941__auto____$1 = s2;
          if(and__3941__auto____$1) {
            return s3
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons(f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(cljs.core.first(s1), cljs.core.first(s2), cljs.core.first(s3)) : f.call(null, cljs.core.first(s1), cljs.core.first(s2), cljs.core.first(s3)), map.cljs$core$IFn$_invoke$arity$4(f, cljs.core.rest(s1), cljs.core.rest(s2), cljs.core.rest(s3)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__4920__delegate = function(f, c1, c2, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss = map.cljs$core$IFn$_invoke$arity$2(cljs.core.seq, cs);
          if(cljs.core.every_QMARK_(cljs.core.identity, ss)) {
            return cljs.core.cons(map.cljs$core$IFn$_invoke$arity$2(cljs.core.first, ss), step(map.cljs$core$IFn$_invoke$arity$2(cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null)
      };
      return map.cljs$core$IFn$_invoke$arity$2(function(p1__4916_SHARP_) {
        return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f, p1__4916_SHARP_)
      }, step(cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(colls, c3, cljs.core.array_seq([c2, c1], 0))))
    };
    var G__4920 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4920__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4920.cljs$lang$maxFixedArity = 4;
    G__4920.cljs$lang$applyTo = function(arglist__4921) {
      var f = cljs.core.first(arglist__4921);
      arglist__4921 = cljs.core.next(arglist__4921);
      var c1 = cljs.core.first(arglist__4921);
      arglist__4921 = cljs.core.next(arglist__4921);
      var c2 = cljs.core.first(arglist__4921);
      arglist__4921 = cljs.core.next(arglist__4921);
      var c3 = cljs.core.first(arglist__4921);
      var colls = cljs.core.rest(arglist__4921);
      return G__4920__delegate(f, c1, c2, c3, colls)
    };
    G__4920.cljs$core$IFn$_invoke$arity$variadic = G__4920__delegate;
    return G__4920
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$core$IFn$_invoke$arity$2 = map__2;
  map.cljs$core$IFn$_invoke$arity$3 = map__3;
  map.cljs$core$IFn$_invoke$arity$4 = map__4;
  map.cljs$core$IFn$_invoke$arity$variadic = map__5.cljs$core$IFn$_invoke$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto__ = cljs.core.seq(coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons(cljs.core.first(s), take(n - 1, cljs.core.rest(s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq(coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = n__$1 > 0;
        if(and__3941__auto__) {
          return s
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4922 = n__$1 - 1;
        var G__4923 = cljs.core.rest(s);
        n__$1 = G__4922;
        coll__$1 = G__4923;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step(n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.cljs$core$IFn$_invoke$arity$2(1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.cljs$core$IFn$_invoke$arity$3(function(x, _) {
      return x
    }, s, cljs.core.drop(n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$core$IFn$_invoke$arity$1 = drop_last__1;
  drop_last.cljs$core$IFn$_invoke$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq(coll);
  var lead = cljs.core.seq(cljs.core.drop(n, coll));
  while(true) {
    if(lead) {
      var G__4924 = cljs.core.next(s);
      var G__4925 = cljs.core.next(lead);
      s = G__4924;
      lead = G__4925;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq(coll__$1);
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = s;
        if(and__3941__auto__) {
          return pred__$1.cljs$core$IFn$_invoke$arity$1 ? pred__$1.cljs$core$IFn$_invoke$arity$1(cljs.core.first(s)) : pred__$1.call(null, cljs.core.first(s))
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__4926 = pred__$1;
        var G__4927 = cljs.core.rest(s);
        pred__$1 = G__4926;
        coll__$1 = G__4927;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step(pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq(coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(s, cycle(s))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take(n, coll), cljs.core.drop(n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(x, repeat.cljs$core$IFn$_invoke$arity$1(x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take(n, repeat.cljs$core$IFn$_invoke$arity$1(x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$core$IFn$_invoke$arity$1 = repeat__1;
  repeat.cljs$core$IFn$_invoke$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take(n, cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null), repeatedly.cljs$core$IFn$_invoke$arity$1(f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take(n, repeatedly.cljs$core$IFn$_invoke$arity$1(f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$core$IFn$_invoke$arity$1 = repeatedly__1;
  repeatedly.cljs$core$IFn$_invoke$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons(x, new cljs.core.LazySeq(null, false, function() {
    return iterate(f, f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq(c1);
      var s2 = cljs.core.seq(c2);
      if(function() {
        var and__3941__auto__ = s1;
        if(and__3941__auto__) {
          return s2
        }else {
          return and__3941__auto__
        }
      }()) {
        return cljs.core.cons(cljs.core.first(s1), cljs.core.cons(cljs.core.first(s2), interleave.cljs$core$IFn$_invoke$arity$2(cljs.core.rest(s1), cljs.core.rest(s2))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__4928__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss = cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.seq, cljs.core.conj.cljs$core$IFn$_invoke$arity$variadic(colls, c2, cljs.core.array_seq([c1], 0)));
        if(cljs.core.every_QMARK_(cljs.core.identity, ss)) {
          return cljs.core.concat.cljs$core$IFn$_invoke$arity$2(cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.first, ss), cljs.core.apply.cljs$core$IFn$_invoke$arity$2(interleave, cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null)
    };
    var G__4928 = function(c1, c2, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4928__delegate.call(this, c1, c2, colls)
    };
    G__4928.cljs$lang$maxFixedArity = 2;
    G__4928.cljs$lang$applyTo = function(arglist__4929) {
      var c1 = cljs.core.first(arglist__4929);
      arglist__4929 = cljs.core.next(arglist__4929);
      var c2 = cljs.core.first(arglist__4929);
      var colls = cljs.core.rest(arglist__4929);
      return G__4928__delegate(c1, c2, colls)
    };
    G__4928.cljs$core$IFn$_invoke$arity$variadic = G__4928__delegate;
    return G__4928
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$core$IFn$_invoke$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$core$IFn$_invoke$arity$2 = interleave__2;
  interleave.cljs$core$IFn$_invoke$arity$variadic = interleave__3.cljs$core$IFn$_invoke$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop(1, cljs.core.interleave.cljs$core$IFn$_invoke$arity$2(cljs.core.repeat.cljs$core$IFn$_invoke$arity$1(sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq(coll);
      if(temp__4090__auto__) {
        var coll__$1 = temp__4090__auto__;
        return cljs.core.cons(cljs.core.first(coll__$1), cat(cljs.core.rest(coll__$1), colls__$1))
      }else {
        if(cljs.core.seq(colls__$1)) {
          return cat(cljs.core.first(colls__$1), cljs.core.rest(colls__$1))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat(null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(f, coll))
  };
  var mapcat__3 = function() {
    var G__4930__delegate = function(f, coll, colls) {
      return cljs.core.flatten1(cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.map, f, coll, colls))
    };
    var G__4930 = function(f, coll, var_args) {
      var colls = null;
      if(arguments.length > 2) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4930__delegate.call(this, f, coll, colls)
    };
    G__4930.cljs$lang$maxFixedArity = 2;
    G__4930.cljs$lang$applyTo = function(arglist__4931) {
      var f = cljs.core.first(arglist__4931);
      arglist__4931 = cljs.core.next(arglist__4931);
      var coll = cljs.core.first(arglist__4931);
      var colls = cljs.core.rest(arglist__4931);
      return G__4930__delegate(f, coll, colls)
    };
    G__4930.cljs$core$IFn$_invoke$arity$variadic = G__4930__delegate;
    return G__4930
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$core$IFn$_invoke$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$core$IFn$_invoke$arity$2 = mapcat__2;
  mapcat.cljs$core$IFn$_invoke$arity$variadic = mapcat__3.cljs$core$IFn$_invoke$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq(coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.chunked_seq_QMARK_(s)) {
        var c = cljs.core.chunk_first(s);
        var size = cljs.core.count(c);
        var b = cljs.core.chunk_buffer(size);
        var n__3078__auto___4932 = size;
        var i_4933 = 0;
        while(true) {
          if(i_4933 < n__3078__auto___4932) {
            if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4933)) : pred.call(null, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4933)))) {
              cljs.core.chunk_append(b, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c, i_4933))
            }else {
            }
            var G__4934 = i_4933 + 1;
            i_4933 = G__4934;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons(cljs.core.chunk(b), filter(pred, cljs.core.chunk_rest(s)))
      }else {
        var f = cljs.core.first(s);
        var r = cljs.core.rest(s);
        if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(f) : pred.call(null, f))) {
          return cljs.core.cons(f, filter(pred, r))
        }else {
          return filter(pred, r)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter(cljs.core.complement(pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(node, cljs.core.truth_(branch_QMARK_.cljs$core$IFn$_invoke$arity$1 ? branch_QMARK_.cljs$core$IFn$_invoke$arity$1(node) : branch_QMARK_.call(null, node)) ? cljs.core.mapcat.cljs$core$IFn$_invoke$arity$2(walk, children.cljs$core$IFn$_invoke$arity$1 ? children.cljs$core$IFn$_invoke$arity$1(node) : children.call(null, node)) : null)
    }, null)
  };
  return walk(root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter(function(p1__4935_SHARP_) {
    return!cljs.core.sequential_QMARK_(p1__4935_SHARP_)
  }, cljs.core.rest(cljs.core.tree_seq(cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(!(to == null)) {
    if(function() {
      var G__4937 = to;
      if(G__4937) {
        if(function() {
          var or__3943__auto__ = G__4937.cljs$lang$protocol_mask$partition1$ & 4;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__4937.cljs$core$IEditableCollection$
          }
        }()) {
          return true
        }else {
          return false
        }
      }else {
        return false
      }
    }()) {
      return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj_BANG_, cljs.core.transient$(to), from))
    }else {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, to, from)
    }
  }else {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj, cljs.core.List.EMPTY, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(v, o) {
      return cljs.core.conj_BANG_(v, f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(o) : f.call(null, o))
    }, cljs.core.transient$(cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.map.cljs$core$IFn$_invoke$arity$3(f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.map.cljs$core$IFn$_invoke$arity$4(f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__4938__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into(cljs.core.PersistentVector.EMPTY, cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(cljs.core.map, f, c1, c2, c3, cljs.core.array_seq([colls], 0)))
    };
    var G__4938 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(arguments.length > 4) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__4938__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__4938.cljs$lang$maxFixedArity = 4;
    G__4938.cljs$lang$applyTo = function(arglist__4939) {
      var f = cljs.core.first(arglist__4939);
      arglist__4939 = cljs.core.next(arglist__4939);
      var c1 = cljs.core.first(arglist__4939);
      arglist__4939 = cljs.core.next(arglist__4939);
      var c2 = cljs.core.first(arglist__4939);
      arglist__4939 = cljs.core.next(arglist__4939);
      var c3 = cljs.core.first(arglist__4939);
      var colls = cljs.core.rest(arglist__4939);
      return G__4938__delegate(f, c1, c2, c3, colls)
    };
    G__4938.cljs$core$IFn$_invoke$arity$variadic = G__4938__delegate;
    return G__4938
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$core$IFn$_invoke$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$core$IFn$_invoke$arity$2 = mapv__2;
  mapv.cljs$core$IFn$_invoke$arity$3 = mapv__3;
  mapv.cljs$core$IFn$_invoke$arity$4 = mapv__4;
  mapv.cljs$core$IFn$_invoke$arity$variadic = mapv__5.cljs$core$IFn$_invoke$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(v, o) {
    if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(o) : pred.call(null, o))) {
      return cljs.core.conj_BANG_(v, o)
    }else {
      return v
    }
  }, cljs.core.transient$(cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.cljs$core$IFn$_invoke$arity$3(n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take(n, s);
        if(n === cljs.core.count(p)) {
          return cljs.core.cons(p, partition.cljs$core$IFn$_invoke$arity$3(n, step, cljs.core.drop(step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        var p = cljs.core.take(n, s);
        if(n === cljs.core.count(p)) {
          return cljs.core.cons(p, partition.cljs$core$IFn$_invoke$arity$4(n, step, pad, cljs.core.drop(step, s)))
        }else {
          return cljs.core.list.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.take(n, cljs.core.concat.cljs$core$IFn$_invoke$arity$2(p, pad))], 0))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$core$IFn$_invoke$arity$2 = partition__2;
  partition.cljs$core$IFn$_invoke$arity$3 = partition__3;
  partition.cljs$core$IFn$_invoke$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return get_in.cljs$core$IFn$_invoke$arity$3(m, ks, null)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq(ks);
    while(true) {
      if(ks__$1) {
        if(!function() {
          var G__4941 = m__$1;
          if(G__4941) {
            if(function() {
              var or__3943__auto__ = G__4941.cljs$lang$protocol_mask$partition0$ & 256;
              if(or__3943__auto__) {
                return or__3943__auto__
              }else {
                return G__4941.cljs$core$ILookup$
              }
            }()) {
              return true
            }else {
              if(!G__4941.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_(cljs.core.ILookup, G__4941)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_(cljs.core.ILookup, G__4941)
          }
        }()) {
          return not_found
        }else {
          var m__$2 = cljs.core.get.cljs$core$IFn$_invoke$arity$3(m__$1, cljs.core.first(ks__$1), sentinel);
          if(sentinel === m__$2) {
            return not_found
          }else {
            var G__4942 = sentinel;
            var G__4943 = m__$2;
            var G__4944 = cljs.core.next(ks__$1);
            sentinel = G__4942;
            m__$1 = G__4943;
            ks__$1 = G__4944;
            continue
          }
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$core$IFn$_invoke$arity$2 = get_in__2;
  get_in.cljs$core$IFn$_invoke$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__4945, v) {
  var vec__4947 = p__4945;
  var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4947, 0, null);
  var ks = cljs.core.nthnext(vec__4947, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, assoc_in(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), ks, v))
  }else {
    return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in = null;
  var update_in__3 = function(m, p__4948, f) {
    var vec__4958 = p__4948;
    var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4958, 0, null);
    var ks = cljs.core.nthnext(vec__4958, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, update_in.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), ks, f))
    }else {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k)) : f.call(null, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k)))
    }
  };
  var update_in__4 = function(m, p__4949, f, a) {
    var vec__4959 = p__4949;
    var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4959, 0, null);
    var ks = cljs.core.nthnext(vec__4959, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, update_in.cljs$core$IFn$_invoke$arity$4(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), ks, f, a))
    }else {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a) : f.call(null, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a))
    }
  };
  var update_in__5 = function(m, p__4950, f, a, b) {
    var vec__4960 = p__4950;
    var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4960, 0, null);
    var ks = cljs.core.nthnext(vec__4960, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, update_in.cljs$core$IFn$_invoke$arity$5(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), ks, f, a, b))
    }else {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a, b) : f.call(null, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a, b))
    }
  };
  var update_in__6 = function(m, p__4951, f, a, b, c) {
    var vec__4961 = p__4951;
    var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4961, 0, null);
    var ks = cljs.core.nthnext(vec__4961, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, update_in.cljs$core$IFn$_invoke$arity$6(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), ks, f, a, b, c))
    }else {
      return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a, b, c) : f.call(null, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a, b, c))
    }
  };
  var update_in__7 = function() {
    var G__4963__delegate = function(m, p__4952, f, a, b, c, args) {
      var vec__4962 = p__4952;
      var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__4962, 0, null);
      var ks = cljs.core.nthnext(vec__4962, 1);
      if(cljs.core.truth_(ks)) {
        return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(update_in, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), ks, f, a, cljs.core.array_seq([b, c, args], 0)))
      }else {
        return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(f, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), a, b, c, cljs.core.array_seq([args], 0)))
      }
    };
    var G__4963 = function(m, p__4952, f, a, b, c, var_args) {
      var args = null;
      if(arguments.length > 6) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 6), 0)
      }
      return G__4963__delegate.call(this, m, p__4952, f, a, b, c, args)
    };
    G__4963.cljs$lang$maxFixedArity = 6;
    G__4963.cljs$lang$applyTo = function(arglist__4964) {
      var m = cljs.core.first(arglist__4964);
      arglist__4964 = cljs.core.next(arglist__4964);
      var p__4952 = cljs.core.first(arglist__4964);
      arglist__4964 = cljs.core.next(arglist__4964);
      var f = cljs.core.first(arglist__4964);
      arglist__4964 = cljs.core.next(arglist__4964);
      var a = cljs.core.first(arglist__4964);
      arglist__4964 = cljs.core.next(arglist__4964);
      var b = cljs.core.first(arglist__4964);
      arglist__4964 = cljs.core.next(arglist__4964);
      var c = cljs.core.first(arglist__4964);
      var args = cljs.core.rest(arglist__4964);
      return G__4963__delegate(m, p__4952, f, a, b, c, args)
    };
    G__4963.cljs$core$IFn$_invoke$arity$variadic = G__4963__delegate;
    return G__4963
  }();
  update_in = function(m, p__4952, f, a, b, c, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 3:
        return update_in__3.call(this, m, p__4952, f);
      case 4:
        return update_in__4.call(this, m, p__4952, f, a);
      case 5:
        return update_in__5.call(this, m, p__4952, f, a, b);
      case 6:
        return update_in__6.call(this, m, p__4952, f, a, b, c);
      default:
        return update_in__7.cljs$core$IFn$_invoke$arity$variadic(m, p__4952, f, a, b, c, cljs.core.array_seq(arguments, 6))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  update_in.cljs$lang$maxFixedArity = 6;
  update_in.cljs$lang$applyTo = update_in__7.cljs$lang$applyTo;
  update_in.cljs$core$IFn$_invoke$arity$3 = update_in__3;
  update_in.cljs$core$IFn$_invoke$arity$4 = update_in__4;
  update_in.cljs$core$IFn$_invoke$arity$5 = update_in__5;
  update_in.cljs$core$IFn$_invoke$arity$6 = update_in__6;
  update_in.cljs$core$IFn$_invoke$arity$variadic = update_in__7.cljs$core$IFn$_invoke$arity$variadic;
  return update_in
}();
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorStr = "cljs.core/VectorNode";
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__2844__auto__, writer__2845__auto__, opts__2846__auto__) {
  return cljs.core._write(writer__2845__auto__, "cljs.core/VectorNode")
};
cljs.core.__GT_VectorNode = function __GT_VectorNode(edit, arr) {
  return new cljs.core.VectorNode(edit, arr)
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, new Array(32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node(edit);
      var _ = cljs.core.pv_aset(r, 0, embed);
      var G__4965 = ll - 5;
      var G__4966 = r;
      ll = G__4965;
      ret = G__4966;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node(parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset(ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget(parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail(pv, level - 5, child, tailnode);
      cljs.core.pv_aset(ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path(null, level - 5, tailnode);
      cljs.core.pv_aset(ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.vector_index_out_of_bounds = function vector_index_out_of_bounds(i, cnt) {
  throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(cnt)].join(""));
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < pv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off(pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__4967 = cljs.core.pv_aget(node, i >>> level & 31);
          var G__4968 = level - 5;
          node = G__4967;
          level = G__4968;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    return cljs.core.vector_index_out_of_bounds(i, pv.cnt)
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node(node);
  if(level === 0) {
    cljs.core.pv_aset(ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset(ret, subidx, do_assoc(pv, level - 5, cljs.core.pv_aget(node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail(pv, level - 5, cljs.core.pv_aget(node, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node(node);
      cljs.core.pv_aset(ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0:else") {
        var ret = cljs.core.pv_clone_node(node);
        cljs.core.pv_aset(ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorStr = "cljs.core/PersistentVector";
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.cljs$core$IFn$_invoke$arity$1 ? cljs.core.tv_editable_root.cljs$core$IFn$_invoke$arity$1(self__.root) : cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.cljs$core$IFn$_invoke$arity$1 ? cljs.core.tv_editable_tail.cljs$core$IFn$_invoke$arity$1(self__.tail) : cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= k;
    if(and__3941__auto__) {
      return k < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(cljs.core.tail_off(coll) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc(coll, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0:else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__4970 = null;
  var G__4970__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, k)
  };
  var G__4970__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
  };
  G__4970 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4970__2.call(this, self__, k);
      case 3:
        return G__4970__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4970
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args4969) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4969.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for(v, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(init__$1, j + i, arr[j]) : f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_(init__$2)) {
              return init__$2
            }else {
              var G__4971 = j + 1;
              var G__4972 = init__$2;
              j = G__4971;
              init__$1 = G__4972;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_(init__$1)) {
        return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$1) : cljs.core.deref.call(null, init__$1)
      }else {
        var G__4973 = i + step_init[0];
        i = G__4973;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(self__.cnt - cljs.core.tail_off(coll) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node(null);
      cljs.core.pv_aset(n_r, 0, self__.root);
      cljs.core.pv_aset(n_r, 1, cljs.core.new_path(null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail(coll, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$2(v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$3(v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    return null
  }else {
    if(self__.cnt < 32) {
      return cljs.core.array_seq.cljs$core$IFn$_invoke$arity$1(self__.tail)
    }else {
      if("\ufdd0:else") {
        return cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$3(coll, 0, 0) : cljs.core.chunked_seq.call(null, coll, 0, 0)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta(cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off(coll)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if("\ufdd0:else") {
          var new_tail = cljs.core.array_for(coll, self__.cnt - 2);
          var nr = cljs.core.pop_tail(coll, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(function() {
            var and__3941__auto__ = 5 < self__.shift;
            if(and__3941__auto__) {
              return cljs.core.pv_aget(new_root, 1) == null
            }else {
              return and__3941__auto__
            }
          }()) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget(new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core.array_for(coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentVector = function __GT_PersistentVector(meta, cnt, shift, root, tail, __hash) {
  return new cljs.core.PersistentVector(meta, cnt, shift, root, tail, __hash)
};
cljs.core.PersistentVector.EMPTY_NODE = new cljs.core.VectorNode(null, new Array(32));
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient(v);
    while(true) {
      if(i < l) {
        var G__4974 = i + 1;
        var G__4975 = cljs.core.conj_BANG_(out, xs__$1[i]);
        i = G__4974;
        out = G__4975;
        continue
      }else {
        return cljs.core.persistent_BANG_(out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj_BANG_, cljs.core._as_transient(cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec(args)
  };
  var vector = function(var_args) {
    var args = null;
    if(arguments.length > 0) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__4976) {
    var args = cljs.core.seq(arglist__4976);
    return vector__delegate(args)
  };
  vector.cljs$core$IFn$_invoke$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31719660;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorStr = "cljs.core/ChunkedSeq";
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$4 ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$4(self__.vec, self__.node, self__.i, self__.off + 1) : cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ChunkedSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$4 ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$4(self__.vec, self__.node, self__.i, self__.off + 1) : cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count(self__.vec) ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$3(self__.vec, self__.i + l, 0) : cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$5 ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$5(self__.vec, self__.node, self__.i, self__.off, m) : cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.array_chunk.cljs$core$IFn$_invoke$arity$2(self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count(self__.vec) ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.core.chunked_seq.cljs$core$IFn$_invoke$arity$3(self__.vec, self__.i + l, 0) : cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.__GT_ChunkedSeq = function __GT_ChunkedSeq(vec, node, i, off, meta, __hash) {
  return new cljs.core.ChunkedSeq(vec, node, i, off, meta, __hash)
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return new cljs.core.ChunkedSeq(vec, cljs.core.array_for(vec, i), i, off, null, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, null, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$core$IFn$_invoke$arity$3 = chunked_seq__3;
  chunked_seq.cljs$core$IFn$_invoke$arity$4 = chunked_seq__4;
  chunked_seq.cljs$core$IFn$_invoke$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorStr = "cljs.core/Subvec";
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5 ? cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5(self__.meta, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.v, v_pos, val), self__.start, self__.end > v_pos + 1 ? self__.end : v_pos + 1, null) : cljs.core.build_subvec.call(null, self__.meta, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.v, v_pos, val), self__.start, self__.end > v_pos + 1 ? self__.end : v_pos + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__4978 = null;
  var G__4978__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, k)
  };
  var G__4978__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
  };
  G__4978 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4978__2.call(this, self__, k);
      case 3:
        return G__4978__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4978
}();
cljs.core.Subvec.prototype.apply = function(self__, args4977) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4977.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5 ? cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5(self__.meta, cljs.core._assoc_n(self__.v, self__.end, o), self__.start, self__.end + 1, null) : cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n(self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$2(coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$3(coll, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons(cljs.core._nth.cljs$core$IFn$_invoke$arity$2(self__.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq(i + 1)
      }, null))
    }
  };
  return subvec_seq(self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5 ? cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5(self__.meta, self__.v, self__.start, self__.end - 1, null) : cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5 ? cljs.core.build_subvec.cljs$core$IFn$_invoke$arity$5(meta__$1, self__.v, self__.start, self__.end, self__.__hash) : cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(function() {
    var or__3943__auto__ = n < 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return self__.end <= self__.start + n
    }
  }()) {
    return cljs.core.vector_index_out_of_bounds(n, self__.end - self__.start)
  }else {
    return cljs.core._nth.cljs$core$IFn$_invoke$arity$2(self__.v, self__.start + n)
  }
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var or__3943__auto__ = n < 0;
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return self__.end <= self__.start + n
    }
  }()) {
    return not_found
  }else {
    return cljs.core._nth.cljs$core$IFn$_invoke$arity$3(self__.v, self__.start + n, not_found)
  }
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.__GT_Subvec = function __GT_Subvec(meta, v, start, end, __hash) {
  return new cljs.core.Subvec(meta, v, start, end, __hash)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  while(true) {
    if(v instanceof cljs.core.Subvec) {
      var G__4979 = meta;
      var G__4980 = v.v;
      var G__4981 = v.start + start;
      var G__4982 = v.start + end;
      var G__4983 = __hash;
      meta = G__4979;
      v = G__4980;
      start = G__4981;
      end = G__4982;
      __hash = G__4983;
      continue
    }else {
      var c = cljs.core.count(v);
      if(function() {
        var or__3943__auto__ = start < 0;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          var or__3943__auto____$1 = end < 0;
          if(or__3943__auto____$1) {
            return or__3943__auto____$1
          }else {
            var or__3943__auto____$2 = start > c;
            if(or__3943__auto____$2) {
              return or__3943__auto____$2
            }else {
              return end > c
            }
          }
        }
      }()) {
        throw new Error("Index out of bounds");
      }else {
      }
      return new cljs.core.Subvec(meta, v, start, end, __hash)
    }
    break
  }
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.cljs$core$IFn$_invoke$arity$3(v, start, cljs.core.count(v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$core$IFn$_invoke$arity$2 = subvec__2;
  subvec.cljs$core$IFn$_invoke$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = new Array(32);
  cljs.core.array_copy(tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable(tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset(ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget(ret, subidx);
    if(!(child == null)) {
      return tv_push_tail(tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path(tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable(tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail(tv, level - 5, cljs.core.pv_aget(node__$1, subidx));
    if(function() {
      var and__3941__auto__ = new_child == null;
      if(and__3941__auto__) {
        return subidx === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset(node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0:else") {
        cljs.core.pv_aset(node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto__ = 0 <= i;
    if(and__3941__auto__) {
      return i < tv.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off(tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__4984 = cljs.core.tv_ensure_editable(root.edit, cljs.core.pv_aget(node, i >>> level & 31));
          var G__4985 = level - 5;
          node = G__4984;
          level = G__4985;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorStr = "cljs.core/TransientVector";
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__4987 = null;
  var G__4987__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4987__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4987 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4987__2.call(this, self__, k);
      case 3:
        return G__4987__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4987
}();
cljs.core.TransientVector.prototype.apply = function(self__, args4986) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4986.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(self__.root.edit) {
    return cljs.core.array_for(coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = 0 <= n;
    if(and__3941__auto__) {
      return n < self__.cnt
    }else {
      return and__3941__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  if(self__.root.edit) {
    if(function() {
      var and__3941__auto__ = 0 <= n;
      if(and__3941__auto__) {
        return n < self__.cnt
      }else {
        return and__3941__auto__
      }
    }()) {
      if(cljs.core.tail_off(tcoll) <= n) {
        self__.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable(self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset(node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset(node__$1, subidx, go(level - 5, cljs.core.pv_aget(node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll
      }
    }else {
      if(n === self__.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0:else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0:else") {
            var new_tail = cljs.core.editable_array_for(tcoll, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail(tcoll, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, new Array(32))
              }
            }();
            if(function() {
              var and__3941__auto__ = 5 < self__.shift;
              if(and__3941__auto__) {
                return cljs.core.pv_aget(new_root, 1) == null
              }else {
                return and__3941__auto__
              }
            }()) {
              var new_root__$1 = cljs.core.tv_ensure_editable(self__.root.edit, cljs.core.pv_aget(new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off(tcoll) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = new Array(32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = new Array(32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path(self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }else {
        var new_root = cljs.core.tv_push_tail(tcoll, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off(tcoll);
    var trimmed_tail = new Array(len);
    cljs.core.array_copy(self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.__GT_TransientVector = function __GT_TransientVector(cnt, shift, root, tail) {
  return new cljs.core.TransientVector(cnt, shift, root, tail)
};
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorStr = "cljs.core/PersistentQueueSeq";
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first(self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var temp__4090__auto__ = cljs.core.next(self__.front);
  if(temp__4090__auto__) {
    var f1 = temp__4090__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentQueueSeq = function __GT_PersistentQueueSeq(meta, front, rear, __hash) {
  return new cljs.core.PersistentQueueSeq(meta, front, rear, __hash)
};
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorStr = "cljs.core/PersistentQueue";
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.cljs$core$IFn$_invoke$arity$2(function() {
      var or__3943__auto__ = self__.rear;
      if(cljs.core.truth_(or__3943__auto__)) {
        return or__3943__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.cljs$core$IFn$_invoke$arity$2(self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var rear__$1 = cljs.core.seq(self__.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto__ = self__.front;
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq(rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first(self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__4090__auto__ = cljs.core.next(self__.front);
    if(temp__4090__auto__) {
      var f1 = temp__4090__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq(self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first(self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest(cljs.core.seq(coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.__GT_PersistentQueue = function __GT_PersistentQueue(meta, count, front, rear, __hash) {
  return new cljs.core.PersistentQueue(meta, count, front, rear, __hash)
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorStr = "cljs.core/NeverEquiv";
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return false
};
cljs.core.__GT_NeverEquiv = function __GT_NeverEquiv() {
  return new cljs.core.NeverEquiv
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$(cljs.core.map_QMARK_(y) ? cljs.core.count(x) === cljs.core.count(y) ? cljs.core.every_QMARK_(cljs.core.identity, cljs.core.map.cljs$core$IFn$_invoke$arity$2(function(xkv) {
    return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(y, cljs.core.first(xkv), cljs.core.never_equiv), cljs.core.second(xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__4988 = i + incr;
        i = G__4988;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.cljs$core$IFn$_invoke$arity$1(a);
  var b__$1 = cljs.core.hash.cljs$core$IFn$_invoke$arity$1(b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if("\ufdd0:else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var mm = cljs.core.meta(m);
  var i = 0;
  var out = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__4989 = i + 1;
      var G__4990 = cljs.core.assoc_BANG_(out, k__$1, so[k__$1]);
      i = G__4989;
      out = G__4990;
      continue
    }else {
      return cljs.core.with_meta(cljs.core.persistent_BANG_(cljs.core.assoc_BANG_(out, k, v)), mm)
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_4991 = 0;
  while(true) {
    if(i_4991 < l) {
      var k_4992 = ks[i_4991];
      new_obj[k_4992] = obj[k_4992];
      var G__4993 = i_4991 + 1;
      i_4991 = G__4993;
      continue
    }else {
    }
    break
  }
  return new_obj
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorStr = "cljs.core/ObjMap";
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.transient$(cljs.core.into(cljs.core.hash_map.cljs$core$IFn$_invoke$arity$0 ? cljs.core.hash_map.cljs$core$IFn$_invoke$arity$0() : cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_imap(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array(1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto__ = self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        return self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map(coll, k, v)
    }else {
      if(!(cljs.core.scan_array(1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone(self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone(self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map(coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array(1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__4996 = null;
  var G__4996__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__4996__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__4996 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4996__2.call(this, self__, k);
      case 3:
        return G__4996__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__4996
}();
cljs.core.ObjMap.prototype.apply = function(self__, args4995) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args4995.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq(keys__$1)) {
      var k = cljs.core.first(keys__$1);
      var init__$2 = f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(init__$1, k, self__.strobj[k]) : f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_(init__$2)) {
        return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$2) : cljs.core.deref.call(null, init__$2)
      }else {
        var G__4997 = cljs.core.rest(keys__$1);
        var G__4998 = init__$2;
        keys__$1 = G__4997;
        init__$1 = G__4998;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 0), cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.cljs$core$IFn$_invoke$arity$2(function(p1__4994_SHARP_) {
      return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([p1__4994_SHARP_, self__.strobj[p1__4994_SHARP_]], 0))
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3941__auto__ = goog.isString(k);
    if(and__3941__auto__) {
      return!(cljs.core.scan_array(1, k, self__.keys) == null)
    }else {
      return and__3941__auto__
    }
  }()) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone(self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array(1, k, new_keys), 1);
    delete new_strobj[k];
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.__GT_ObjMap = function __GT_ObjMap(meta, keys, strobj, update_count, __hash) {
  return new cljs.core.ObjMap(meta, keys, strobj, update_count, __hash)
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 8;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.array_map_index_of_nil_QMARK_ = function array_map_index_of_nil_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(arr[i] == null) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__4999 = i + 2;
          i = G__4999;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_symbol_QMARK_ = function array_map_index_of_symbol_QMARK_(arr, m, k) {
  var len = arr.length;
  var kstr = k.str;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(function() {
        var k_SINGLEQUOTE_ = arr[i];
        var and__3941__auto__ = k_SINGLEQUOTE_ instanceof cljs.core.Symbol;
        if(and__3941__auto__) {
          return kstr === k_SINGLEQUOTE_.str
        }else {
          return and__3941__auto__
        }
      }()) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__5000 = i + 2;
          i = G__5000;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_identical_QMARK_ = function array_map_index_of_identical_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(k === arr[i]) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__5001 = i + 2;
          i = G__5001;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of_equiv_QMARK_ = function array_map_index_of_equiv_QMARK_(arr, m, k) {
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k, arr[i])) {
        return i
      }else {
        if("\ufdd0:else") {
          var G__5002 = i + 2;
          i = G__5002;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  if(function() {
    var or__3943__auto__ = goog.isString(k);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      return typeof k === "number"
    }
  }()) {
    return cljs.core.array_map_index_of_identical_QMARK_(arr, m, k)
  }else {
    if(k instanceof cljs.core.Symbol) {
      return cljs.core.array_map_index_of_symbol_QMARK_(arr, m, k)
    }else {
      if(k == null) {
        return cljs.core.array_map_index_of_nil_QMARK_(arr, m, k)
      }else {
        if("\ufdd0:else") {
          return cljs.core.array_map_index_of_equiv_QMARK_(arr, m, k)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.array_map_extend_kv = function array_map_extend_kv(m, k, v) {
  var arr = m.arr;
  var l = arr.length;
  var narr = new Array(l + 2);
  var i_5003 = 0;
  while(true) {
    if(i_5003 < l) {
      narr[i_5003] = arr[i_5003];
      var G__5004 = i_5003 + 1;
      i_5003 = G__5004;
      continue
    }else {
    }
    break
  }
  narr[l] = k;
  narr[l + 1] = v;
  return narr
};
goog.provide("cljs.core.PersistentArrayMapSeq");
cljs.core.PersistentArrayMapSeq = function(arr, i, _meta) {
  this.arr = arr;
  this.i = i;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850702
};
cljs.core.PersistentArrayMapSeq.cljs$lang$type = true;
cljs.core.PersistentArrayMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentArrayMapSeq";
cljs.core.PersistentArrayMapSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentArrayMapSeq")
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i < self__.arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i + 2, self__._meta)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return(self__.arr.length - self__.i) / 2
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.arr[self__.i], self__.arr[self__.i + 1]], true)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i < self__.arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i + 2, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.PersistentArrayMapSeq(self__.arr, self__.i, new_meta)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__._meta
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_PersistentArrayMapSeq = function __GT_PersistentArrayMapSeq(arr, i, _meta) {
  return new cljs.core.PersistentArrayMapSeq(arr, i, _meta)
};
cljs.core.persistent_array_map_seq = function persistent_array_map_seq(arr, i, _meta) {
  if(i <= arr.length - 2) {
    return new cljs.core.PersistentArrayMapSeq(arr, i, _meta)
  }else {
    return null
  }
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorStr = "cljs.core/PersistentArrayMap";
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_imap(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of(coll, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of(coll, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      var arr__$1 = cljs.core.array_map_extend_kv(coll, k, v);
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, arr__$1, null)
    }else {
      return cljs.core._with_meta(cljs.core._assoc(cljs.core.into(cljs.core.PersistentHashMap.EMPTY, coll), k, v), self__.meta)
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll
    }else {
      if("\ufdd0:else") {
        var arr__$1 = function() {
          var G__5006 = self__.arr.slice();
          G__5006[idx + 1] = v;
          return G__5006
        }();
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, arr__$1, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(cljs.core.array_map_index_of(coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5007 = null;
  var G__5007__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__5007__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__5007 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5007__2.call(this, self__, k);
      case 3:
        return G__5007__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5007
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args5005) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5005.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(init__$1, self__.arr[i], self__.arr[i + 1]) : f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_(init__$2)) {
        return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$2) : cljs.core.deref.call(null, init__$2)
      }else {
        var G__5008 = i + 2;
        var G__5009 = init__$2;
        i = G__5008;
        init__$1 = G__5009;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 0), cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.persistent_array_map_seq(self__.arr, 0, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta(cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of(coll, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr = new Array(new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(k, self__.arr[s])) {
            var G__5010 = s + 2;
            var G__5011 = d;
            s = G__5010;
            d = G__5011;
            continue
          }else {
            if("\ufdd0:else") {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__5012 = s + 2;
              var G__5013 = d + 2;
              s = G__5012;
              d = G__5013;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.__GT_PersistentArrayMap = function __GT_PersistentArrayMap(meta, cnt, arr, __hash) {
  return new cljs.core.PersistentArrayMap(meta, cnt, arr, __hash)
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 8;
cljs.core.PersistentArrayMap.fromArray = function(arr, no_clone) {
  var arr__$1 = no_clone ? arr : arr.slice();
  var cnt = arr__$1.length / 2;
  return new cljs.core.PersistentArrayMap(null, cnt, arr__$1, null)
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorStr = "cljs.core/TransientArrayMap";
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of(tcoll, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__5014_5016 = self__.arr;
      G__5014_5016.pop();
      G__5014_5016.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of(tcoll, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_(cljs.core.array__GT_transient_hash_map.cljs$core$IFn$_invoke$arity$2 ? cljs.core.array__GT_transient_hash_map.cljs$core$IFn$_invoke$arity$2(self__.len, self__.arr) : cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll
      }else {
        self__.arr[idx + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__5015 = o;
      if(G__5015) {
        if(function() {
          var or__3943__auto__ = G__5015.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__5015.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5015.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__5015)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__5015)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.cljs$core$IFn$_invoke$arity$1 ? cljs.core.key.cljs$core$IFn$_invoke$arity$1(o) : cljs.core.key.call(null, o), cljs.core.val.cljs$core$IFn$_invoke$arity$1 ? cljs.core.val.cljs$core$IFn$_invoke$arity$1(o) : cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq(o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first(es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__5017 = cljs.core.next(es);
          var G__5018 = tcoll__$1.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__$1, cljs.core.key.cljs$core$IFn$_invoke$arity$1 ? cljs.core.key.cljs$core$IFn$_invoke$arity$1(e) : cljs.core.key.call(null, e), cljs.core.val.cljs$core$IFn$_invoke$arity$1 ? cljs.core.val.cljs$core$IFn$_invoke$arity$1(e) : cljs.core.val.call(null, e));
          es = G__5017;
          tcoll__$1 = G__5018;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot(self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of(tcoll, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot(self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.__GT_TransientArrayMap = function __GT_TransientArrayMap(editable_QMARK_, len, arr) {
  return new cljs.core.TransientArrayMap(editable_QMARK_, len, arr)
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__5019 = cljs.core.assoc_BANG_(out, arr[i], arr[i + 1]);
      var G__5020 = i + 2;
      out = G__5019;
      i = G__5020;
      continue
    }else {
      return out
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorStr = "cljs.core/Box";
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__2844__auto__, writer__2845__auto__, opts__2846__auto__) {
  return cljs.core._write(writer__2845__auto__, "cljs.core/Box")
};
cljs.core.__GT_Box = function __GT_Box(val) {
  return new cljs.core.Box(val)
};
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5023 = arr.slice();
    G__5023[i] = a;
    return G__5023
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5024 = arr.slice();
    G__5024[i] = a;
    G__5024[j] = b;
    return G__5024
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$core$IFn$_invoke$arity$3 = clone_and_set__3;
  clone_and_set.cljs$core$IFn$_invoke$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = new Array(arr.length - 2);
  cljs.core.array_copy(arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy(arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count(bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$core$IFn$_invoke$arity$4 = edit_and_set__4;
  edit_and_set.cljs$core$IFn$_invoke$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(init__$1, k, arr[i + 1]) : f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_(init__$2)) {
        return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$2) : cljs.core.deref.call(null, init__$2)
      }else {
        var G__5025 = i + 2;
        var G__5026 = init__$2;
        i = G__5025;
        init__$1 = G__5026;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorStr = "cljs.core/BitmapIndexedNode";
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy(earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index(self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count(self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward(earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = new Array(32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_5027 = 0;
        var j_5028 = 0;
        while(true) {
          if(i_5027 < 32) {
            if((self__.bitmap >>> i_5027 & 1) === 0) {
              var G__5029 = i_5027 + 1;
              var G__5030 = j_5028;
              i_5027 = G__5029;
              j_5028 = G__5030;
              continue
            }else {
              nodes[i_5027] = !(self__.arr[j_5028] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(self__.arr[j_5028]), self__.arr[j_5028], self__.arr[j_5028 + 1], added_leaf_QMARK_) : self__.arr[j_5028 + 1];
              var G__5031 = i_5027 + 1;
              var G__5032 = j_5028 + 2;
              i_5027 = G__5031;
              j_5028 = G__5032;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if("\ufdd0:else") {
          var new_arr = new Array(2 * (n + 4));
          cljs.core.array_copy(self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy(self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if("\ufdd0:else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$6(inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.cljs$core$IFn$_invoke$arity$7 ? cljs.core.create_node.cljs$core$IFn$_invoke$arity$7(edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val) : cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$1 ? cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$1(self__.arr) : cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index(self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0:else") {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if("\ufdd0:else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count(self__.bitmap);
    var new_arr = new Array(n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy(self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce(self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index(self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test(key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if("\ufdd0:else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index(self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0:else") {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair(self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair(self__.arr, idx))
      }else {
        if("\ufdd0:else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index(self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count(self__.bitmap);
    if(n >= 16) {
      var nodes = new Array(32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_5033 = 0;
      var j_5034 = 0;
      while(true) {
        if(i_5033 < 32) {
          if((self__.bitmap >>> i_5033 & 1) === 0) {
            var G__5035 = i_5033 + 1;
            var G__5036 = j_5034;
            i_5033 = G__5035;
            j_5034 = G__5036;
            continue
          }else {
            nodes[i_5033] = !(self__.arr[j_5034] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(self__.arr[j_5034]), self__.arr[j_5034], self__.arr[j_5034 + 1], added_leaf_QMARK_) : self__.arr[j_5034 + 1];
            var G__5037 = i_5033 + 1;
            var G__5038 = j_5034 + 2;
            i_5033 = G__5037;
            j_5034 = G__5038;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = new Array(2 * (n + 1));
      cljs.core.array_copy(self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy(self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test(key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, 2 * idx + 1, val))
        }
      }else {
        if("\ufdd0:else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$5(self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.cljs$core$IFn$_invoke$arity$6 ? cljs.core.create_node.cljs$core$IFn$_invoke$arity$6(shift + 5, key_or_nil, val_or_node, hash, key, val) : cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index(self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test(key, key_or_nil)) {
        return val_or_node
      }else {
        if("\ufdd0:else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.__GT_BitmapIndexedNode = function __GT_BitmapIndexedNode(edit, bitmap, arr) {
  return new cljs.core.BitmapIndexedNode(edit, bitmap, arr)
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, new Array(0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = new Array(len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(function() {
        var and__3941__auto__ = !(i === idx);
        if(and__3941__auto__) {
          return!(arr[i] == null)
        }else {
          return and__3941__auto__
        }
      }()) {
        new_arr[j] = arr[i];
        var G__5039 = i + 1;
        var G__5040 = j + 2;
        var G__5041 = bitmap | 1 << i;
        i = G__5039;
        j = G__5040;
        bitmap = G__5041;
        continue
      }else {
        var G__5042 = i + 1;
        var G__5043 = j;
        var G__5044 = bitmap;
        i = G__5042;
        j = G__5043;
        bitmap = G__5044;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorStr = "cljs.core/ArrayNode";
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.cljs$core$IFn$_invoke$arity$1 ? cljs.core.create_array_node_seq.cljs$core$IFn$_invoke$arity$1(self__.arr) : cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node(inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if("\ufdd0:else") {
          return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_(init__$2)) {
          return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$2) : cljs.core.deref.call(null, init__$2)
        }else {
          var G__5045 = i + 1;
          var G__5046 = init__$2;
          i = G__5045;
          init__$1 = G__5046;
          continue
        }
      }else {
        var G__5047 = i + 1;
        var G__5048 = init__$1;
        i = G__5047;
        init__$1 = G__5048;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node(inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, idx, n))
        }
      }else {
        if("\ufdd0:else") {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.__GT_ArrayNode = function __GT_ArrayNode(edit, cnt, arr) {
  return new cljs.core.ArrayNode(edit, cnt, arr)
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test(key, arr[i])) {
        return i
      }else {
        var G__5049 = i + 2;
        i = G__5049;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorStr = "cljs.core/HashCollisionNode";
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index(self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$6(inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = new Array(len + 2);
        cljs.core.array_copy(self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.cljs$core$IFn$_invoke$arity$4(inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$1 ? cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$1(self__.arr) : cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index(self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = new Array(2 * (self__.cnt + 1));
    cljs.core.array_copy(self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce(self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index(self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test(key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index(self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if("\ufdd0:else") {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair(self__.arr, cljs.core.quot(idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index(self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = self__.arr.length;
      var new_arr = new Array(len + 2);
      cljs.core.array_copy(self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.cljs$core$IFn$_invoke$arity$3(self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index(self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test(key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.__GT_HashCollisionNode = function __GT_HashCollisionNode(edit, collision_hash, cnt, arr) {
  return new cljs.core.HashCollisionNode(edit, collision_hash, cnt, arr)
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.cljs$core$IFn$_invoke$arity$1(key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.cljs$core$IFn$_invoke$arity$1(key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$core$IFn$_invoke$arity$6 = create_node__6;
  create_node.cljs$core$IFn$_invoke$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorStr = "cljs.core/NodeSeq";
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first(self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$3(self__.nodes, self__.i + 2, null) : cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$3 ? cljs.core.create_inode_seq.cljs$core$IFn$_invoke$arity$3(self__.nodes, self__.i, cljs.core.next(self__.s)) : cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next(self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_NodeSeq = function __GT_NodeSeq(meta, nodes, i, s, __hash) {
  return new cljs.core.NodeSeq(meta, nodes, i, s, __hash)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.cljs$core$IFn$_invoke$arity$3(nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__4090__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var node = temp__4090__auto__;
              var temp__4090__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____$1)) {
                var node_seq = temp__4090__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__5050 = j + 2;
                j = G__5050;
                continue
              }
            }else {
              var G__5051 = j + 2;
              j = G__5051;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$core$IFn$_invoke$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$core$IFn$_invoke$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorStr = "cljs.core/ArrayNodeSeq";
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first(self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.create_array_node_seq.cljs$core$IFn$_invoke$arity$4 ? cljs.core.create_array_node_seq.cljs$core$IFn$_invoke$arity$4(null, self__.nodes, self__.i, cljs.core.next(self__.s)) : cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next(self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_ArrayNodeSeq = function __GT_ArrayNodeSeq(meta, nodes, i, s, __hash) {
  return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, __hash)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.cljs$core$IFn$_invoke$arity$4(null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__4090__auto__ = nodes[j];
          if(cljs.core.truth_(temp__4090__auto__)) {
            var nj = temp__4090__auto__;
            var temp__4090__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____$1)) {
              var ns = temp__4090__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__5052 = j + 1;
              j = G__5052;
              continue
            }
          }else {
            var G__5053 = j + 1;
            j = G__5053;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$core$IFn$_invoke$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$core$IFn$_invoke$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorStr = "cljs.core/PersistentHashMap";
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_imap(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if("\ufdd0:else") {
        return self__.root.inode_lookup(0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(k == null) {
    if(function() {
      var and__3941__auto__ = self__.has_nil_QMARK_;
      if(and__3941__auto__) {
        return v === self__.nil_val
      }else {
        return and__3941__auto__
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if("\ufdd0:else") {
        return!(self__.root.inode_lookup(0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__5055 = null;
  var G__5055__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__5055__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__5055 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5055__2.call(this, self__, k);
      case 3:
        return G__5055__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5055
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args5054) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5054.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(init, null, self__.nil_val) : f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_(init__$1)) {
    return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$1) : cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if("\ufdd0:else") {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 0), cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons(cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta(cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(self__.root == null) {
      return coll
    }else {
      if("\ufdd0:else") {
        var new_root = self__.root.inode_without(0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k);
        if(new_root === self__.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.__GT_PersistentHashMap = function __GT_PersistentHashMap(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  return new cljs.core.PersistentHashMap(meta, cnt, root, has_nil_QMARK_, nil_val, __hash)
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__5056 = i + 1;
      var G__5057 = cljs.core.assoc_BANG_(out, ks[i], vs[i]);
      i = G__5056;
      out = G__5057;
      continue
    }else {
      return cljs.core.persistent_BANG_(out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorStr = "cljs.core/TransientHashMap";
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__5058 = o;
      if(G__5058) {
        if(function() {
          var or__3943__auto__ = G__5058.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return G__5058.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5058.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__5058)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IMapEntry, G__5058)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.cljs$core$IFn$_invoke$arity$1 ? cljs.core.key.cljs$core$IFn$_invoke$arity$1(o) : cljs.core.key.call(null, o), cljs.core.val.cljs$core$IFn$_invoke$arity$1 ? cljs.core.val.cljs$core$IFn$_invoke$arity$1(o) : cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq(o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__4090__auto__ = cljs.core.first(es);
        if(cljs.core.truth_(temp__4090__auto__)) {
          var e = temp__4090__auto__;
          var G__5059 = cljs.core.next(es);
          var G__5060 = tcoll__$1.assoc_BANG_(cljs.core.key.cljs$core$IFn$_invoke$arity$1 ? cljs.core.key.cljs$core$IFn$_invoke$arity$1(e) : cljs.core.key.call(null, e), cljs.core.val.cljs$core$IFn$_invoke$arity$1 ? cljs.core.val.cljs$core$IFn$_invoke$arity$1(e) : cljs.core.val.call(null, e));
          es = G__5059;
          tcoll__$1 = G__5060;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.cljs$core$IFn$_invoke$arity$1(k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.__GT_TransientHashMap = function __GT_TransientHashMap(edit, root, count, has_nil_QMARK_, nil_val) {
  return new cljs.core.TransientHashMap(edit, root, count, has_nil_QMARK_, nil_val)
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__5061 = ascending_QMARK_ ? t.left : t.right;
      var G__5062 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(stack__$1, t);
      t = G__5061;
      stack__$1 = G__5062;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorStr = "cljs.core/PersistentTreeMapSeq";
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt < 0) {
    return cljs.core.count(cljs.core.next(coll)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.peek(self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var t = cljs.core.first(self__.stack);
  var next_stack = cljs.core.tree_map_seq_push(self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next(self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentTreeMapSeq = function __GT_PersistentTreeMapSeq(meta, stack, ascending_QMARK_, cnt, __hash) {
  return new cljs.core.PersistentTreeMapSeq(meta, stack, ascending_QMARK_, cnt, __hash)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push(tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(ins.right instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0:else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(ins instanceof cljs.core.RedNode) {
    if(ins.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(ins.left instanceof cljs.core.RedNode) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0:else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(right instanceof cljs.core.BlackNode) {
      return cljs.core.balance_right(key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto__ = right instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return right.left instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right(right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0:else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(del instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(left instanceof cljs.core.BlackNode) {
      return cljs.core.balance_left(key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto__ = left instanceof cljs.core.RedNode;
        if(and__3941__auto__) {
          return left.right instanceof cljs.core.BlackNode
        }else {
          return and__3941__auto__
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left(left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0:else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = !(node.left == null) ? tree_map_kv_reduce(node.left, f, init) : init;
  if(cljs.core.reduced_QMARK_(init__$1)) {
    return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$1) : cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(init__$1, node.key, node.val) : f.call(null, init__$1, node.key, node.val);
    if(cljs.core.reduced_QMARK_(init__$2)) {
      return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$2) : cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce(node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_(init__$3)) {
        return cljs.core.deref.cljs$core$IFn$_invoke$arity$1 ? cljs.core.deref.cljs$core$IFn$_invoke$arity$1(init__$3) : cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorStr = "cljs.core/BlackNode";
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__5064 = null;
  var G__5064__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__5064__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__5064 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5064__2.call(this, self__, k);
      case 3:
        return G__5064__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5064
}();
cljs.core.BlackNode.prototype.apply = function(self__, args5063) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5063.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del(self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce(node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del(self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$2(node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$3(node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([self__.key, self__.val], 0))
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n(cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.__GT_BlackNode = function __GT_BlackNode(key, val, left, right, __hash) {
  return new cljs.core.BlackNode(key, val, left, right, __hash)
};
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorStr = "cljs.core/RedNode";
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__5066 = null;
  var G__5066__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__5066__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__5066 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5066__2.call(this, self__, k);
      case 3:
        return G__5066__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5066
}();
cljs.core.RedNode.prototype.apply = function(self__, args5065) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5065.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce(node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.left instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(self__.right instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if("\ufdd0:else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(self__.right instanceof cljs.core.RedNode) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(self__.left instanceof cljs.core.RedNode) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if("\ufdd0:else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$2(node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$3(node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([self__.key, self__.val], 0))
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n(cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0:else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.__GT_RedNode = function __GT_RedNode(key, val, left, right, __hash) {
  return new cljs.core.RedNode(key, val, left, right, __hash)
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.cljs$core$IFn$_invoke$arity$2 ? comp.cljs$core$IFn$_invoke$arity$2(k, tree.key) : comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add(comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if("\ufdd0:else") {
          var ins = tree_map_add(comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(left instanceof cljs.core.RedNode) {
        if(right instanceof cljs.core.RedNode) {
          var app = tree_map_append(left.right, right.left);
          if(app instanceof cljs.core.RedNode) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append(left.right, right), null)
        }
      }else {
        if(right instanceof cljs.core.RedNode) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append(left, right.left), right.right, null)
        }else {
          if("\ufdd0:else") {
            var app = tree_map_append(left.right, right.left);
            if(app instanceof cljs.core.RedNode) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del(left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.cljs$core$IFn$_invoke$arity$2 ? comp.cljs$core$IFn$_invoke$arity$2(k, tree.key) : comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append(tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove(comp, tree.left, k, found);
        if(function() {
          var or__3943__auto__ = !(del == null);
          if(or__3943__auto__) {
            return or__3943__auto__
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(tree.left instanceof cljs.core.BlackNode) {
            return cljs.core.balance_left_del(tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0:else") {
          var del = tree_map_remove(comp, tree.right, k, found);
          if(function() {
            var or__3943__auto__ = !(del == null);
            if(or__3943__auto__) {
              return or__3943__auto__
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(tree.right instanceof cljs.core.BlackNode) {
              return cljs.core.balance_right_del(tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.cljs$core$IFn$_invoke$arity$2 ? comp.cljs$core$IFn$_invoke$arity$2(k, tk) : comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace(comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0:else") {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace(comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorStr = "cljs.core/PersistentTreeMap";
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_imap(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var n = coll.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_add(self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(found, 0);
    if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(v, found_node.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace(self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__5068 = null;
  var G__5068__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__5068__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__5068 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5068__2.call(this, self__, k);
      case 3:
        return G__5068__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5068
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args5067) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5067.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce(self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_(entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 0), cljs.core._nth.cljs$core$IFn$_invoke$arity$2(entry, 1))
  }else {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq(self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.cljs$core$IFn$_invoke$arity$2 ? self__.comp.cljs$core$IFn$_invoke$arity$2(k, t.key) : self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__5069 = t.left;
          t = G__5069;
          continue
        }else {
          if("\ufdd0:else") {
            var G__5070 = t.right;
            t = G__5070;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq(self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.cljs$core$IFn$_invoke$arity$2 ? self__.comp.cljs$core$IFn$_invoke$arity$2(k, t.key) : self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.cljs$core$IFn$_invoke$arity$2(stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__5071 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(stack, t);
              var G__5072 = t.left;
              stack = G__5071;
              t = G__5072;
              continue
            }else {
              var G__5073 = stack;
              var G__5074 = t.right;
              stack = G__5073;
              t = G__5074;
              continue
            }
          }else {
            if("\ufdd0:else") {
              if(c > 0) {
                var G__5075 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(stack, t);
                var G__5076 = t.right;
                stack = G__5075;
                t = G__5076;
                continue
              }else {
                var G__5077 = stack;
                var G__5078 = t.left;
                stack = G__5077;
                t = G__5078;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return cljs.core.key.cljs$core$IFn$_invoke$arity$1 ? cljs.core.key.cljs$core$IFn$_invoke$arity$1(entry) : cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq(self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map(coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_remove(self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.cljs$core$IFn$_invoke$arity$2(found, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.__GT_PersistentTreeMap = function __GT_PersistentTreeMap(comp, tree, cnt, meta, __hash) {
  return new cljs.core.PersistentTreeMap(comp, tree, cnt, meta, __hash)
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq(keyvals);
    var out = cljs.core.transient$(cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__5079 = cljs.core.nnext(in$);
        var G__5080 = cljs.core.assoc_BANG_(out, cljs.core.first(in$), cljs.core.second(in$));
        in$ = G__5079;
        out = G__5080;
        continue
      }else {
        return cljs.core.persistent_BANG_(out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__5081) {
    var keyvals = cljs.core.seq(arglist__5081);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$core$IFn$_invoke$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot(cljs.core.count(keyvals), 2), cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__5082) {
    var keyvals = cljs.core.seq(arglist__5082);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$core$IFn$_invoke$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq(keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first(kvs));
        obj[cljs.core.first(kvs)] = cljs.core.second(kvs);
        var G__5083 = cljs.core.nnext(kvs);
        kvs = G__5083;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.cljs$core$IFn$_invoke$arity$2 ? cljs.core.ObjMap.fromObject.cljs$core$IFn$_invoke$arity$2(ks, obj) : cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__5084) {
    var keyvals = cljs.core.seq(arglist__5084);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$core$IFn$_invoke$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq(keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__5085 = cljs.core.nnext(in$);
        var G__5086 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out, cljs.core.first(in$), cljs.core.second(in$));
        in$ = G__5085;
        out = G__5086;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(arguments.length > 0) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__5087) {
    var keyvals = cljs.core.seq(arglist__5087);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$core$IFn$_invoke$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq(keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator(comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__5088 = cljs.core.nnext(in$);
        var G__5089 = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(out, cljs.core.first(in$), cljs.core.second(in$));
        in$ = G__5088;
        out = G__5089;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(arguments.length > 1) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__5090) {
    var comparator = cljs.core.first(arglist__5090);
    var keyvals = cljs.core.rest(arglist__5090);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$core$IFn$_invoke$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
goog.provide("cljs.core.KeySeq");
cljs.core.KeySeq = function(mseq, _meta) {
  this.mseq = mseq;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.KeySeq.cljs$lang$type = true;
cljs.core.KeySeq.cljs$lang$ctorStr = "cljs.core/KeySeq";
cljs.core.KeySeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/KeySeq")
};
cljs.core.KeySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.KeySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__5091 = self__.mseq;
    if(G__5091) {
      if(function() {
        var or__3943__auto__ = G__5091.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__5091.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__5091.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.INext, G__5091)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.INext, G__5091)
    }
  }() ? self__.mseq.cljs$core$INext$_next$arity$1(self__.mseq) : cljs.core.next(self__.mseq);
  if(nseq == null) {
    return null
  }else {
    return new cljs.core.KeySeq(nseq, self__._meta)
  }
};
cljs.core.KeySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.KeySeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.KeySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.KeySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var me = self__.mseq.cljs$core$ISeq$_first$arity$1(self__.mseq);
  return me.cljs$core$IMapEntry$_key$arity$1(me)
};
cljs.core.KeySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__5092 = self__.mseq;
    if(G__5092) {
      if(function() {
        var or__3943__auto__ = G__5092.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__5092.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__5092.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.INext, G__5092)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.INext, G__5092)
    }
  }() ? self__.mseq.cljs$core$INext$_next$arity$1(self__.mseq) : cljs.core.next(self__.mseq);
  if(!(nseq == null)) {
    return new cljs.core.KeySeq(nseq, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.KeySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.KeySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.KeySeq(self__.mseq, new_meta)
};
cljs.core.KeySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__._meta
};
cljs.core.KeySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_KeySeq = function __GT_KeySeq(mseq, _meta) {
  return new cljs.core.KeySeq(mseq, _meta)
};
cljs.core.keys = function keys(hash_map) {
  var temp__4092__auto__ = cljs.core.seq(hash_map);
  if(temp__4092__auto__) {
    var mseq = temp__4092__auto__;
    return new cljs.core.KeySeq(mseq, null)
  }else {
    return null
  }
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key(map_entry)
};
goog.provide("cljs.core.ValSeq");
cljs.core.ValSeq = function(mseq, _meta) {
  this.mseq = mseq;
  this._meta = _meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.ValSeq.cljs$lang$type = true;
cljs.core.ValSeq.cljs$lang$ctorStr = "cljs.core/ValSeq";
cljs.core.ValSeq.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/ValSeq")
};
cljs.core.ValSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll(coll)
};
cljs.core.ValSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__5093 = self__.mseq;
    if(G__5093) {
      if(function() {
        var or__3943__auto__ = G__5093.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__5093.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__5093.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.INext, G__5093)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.INext, G__5093)
    }
  }() ? self__.mseq.cljs$core$INext$_next$arity$1(self__.mseq) : cljs.core.next(self__.mseq);
  if(nseq == null) {
    return null
  }else {
    return new cljs.core.ValSeq(nseq, self__._meta)
  }
};
cljs.core.ValSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons(o, coll)
};
cljs.core.ValSeq.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.ValSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ValSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  var me = self__.mseq.cljs$core$ISeq$_first$arity$1(self__.mseq);
  return me.cljs$core$IMapEntry$_val$arity$1(me)
};
cljs.core.ValSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var nseq = function() {
    var G__5094 = self__.mseq;
    if(G__5094) {
      if(function() {
        var or__3943__auto__ = G__5094.cljs$lang$protocol_mask$partition0$ & 128;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__5094.cljs$core$INext$
        }
      }()) {
        return true
      }else {
        if(!G__5094.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_(cljs.core.INext, G__5094)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.INext, G__5094)
    }
  }() ? self__.mseq.cljs$core$INext$_next$arity$1(self__.mseq) : cljs.core.next(self__.mseq);
  if(!(nseq == null)) {
    return new cljs.core.ValSeq(nseq, self__._meta)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.ValSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(coll, other)
};
cljs.core.ValSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.ValSeq(self__.mseq, new_meta)
};
cljs.core.ValSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__._meta
};
cljs.core.ValSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__._meta)
};
cljs.core.__GT_ValSeq = function __GT_ValSeq(mseq, _meta) {
  return new cljs.core.ValSeq(mseq, _meta)
};
cljs.core.vals = function vals(hash_map) {
  var temp__4092__auto__ = cljs.core.seq(hash_map);
  if(temp__4092__auto__) {
    var mseq = temp__4092__auto__;
    return new cljs.core.ValSeq(mseq, null)
  }else {
    return null
  }
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val(map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some(cljs.core.identity, maps))) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(function(p1__5095_SHARP_, p2__5096_SHARP_) {
        return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(function() {
          var or__3943__auto__ = p1__5095_SHARP_;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return cljs.core.PersistentArrayMap.EMPTY
          }
        }(), p2__5096_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(arguments.length > 0) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__5097) {
    var maps = cljs.core.seq(arglist__5097);
    return merge__delegate(maps)
  };
  merge.cljs$core$IFn$_invoke$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some(cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first(e);
        var v = cljs.core.second(e);
        if(cljs.core.contains_QMARK_(m, k)) {
          return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), v) : f.call(null, cljs.core.get.cljs$core$IFn$_invoke$arity$2(m, k), v))
        }else {
          return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(m, k, v)
        }
      };
      var merge2 = function(merge_entry) {
        return function(m1, m2) {
          return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(merge_entry, function() {
            var or__3943__auto__ = m1;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return cljs.core.PersistentArrayMap.EMPTY
            }
          }(), cljs.core.seq(m2))
        }
      }(merge_entry);
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$2(merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(arguments.length > 1) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__5098) {
    var f = cljs.core.first(arglist__5098);
    var maps = cljs.core.rest(arglist__5098);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$core$IFn$_invoke$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.PersistentArrayMap.EMPTY;
  var keys = cljs.core.seq(keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first(keys);
      var entry = cljs.core.get.cljs$core$IFn$_invoke$arity$3(map, key, "\ufdd0:cljs.core/not-found");
      var G__5099 = cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(entry, "\ufdd0:cljs.core/not-found") ? cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ret, key, entry) : ret;
      var G__5100 = cljs.core.next(keys);
      ret = G__5099;
      keys = G__5100;
      continue
    }else {
      return ret
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorStr = "cljs.core/PersistentHashSet";
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashSet(cljs.core._as_transient(self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_iset(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_(self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__5103 = null;
  var G__5103__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__5103__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__5103 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5103__2.call(this, self__, k);
      case 3:
        return G__5103__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5103
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args5102) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5102.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys(self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core._dissoc(self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._count(self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_(other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count(coll) === cljs.core.count(other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_(function(p1__5101_SHARP_) {
        return cljs.core.contains_QMARK_(coll, p1__5101_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentHashSet = function __GT_PersistentHashSet(meta, hash_map, __hash) {
  return new cljs.core.PersistentHashSet(meta, hash_map, __hash)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.EMPTY, 0);
cljs.core.PersistentHashSet.fromArray = function(items, no_clone) {
  var len = items.length;
  if(len / 2 <= cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
    var arr = no_clone ? items : items.slice();
    return new cljs.core.PersistentHashSet(null, cljs.core.PersistentArrayMap.fromArray.cljs$core$IFn$_invoke$arity$2 ? cljs.core.PersistentArrayMap.fromArray.cljs$core$IFn$_invoke$arity$2(arr, true) : cljs.core.PersistentArrayMap.fromArray.call(null, arr, true), null)
  }else {
    var i = 0;
    var out = cljs.core.transient$(cljs.core.PersistentHashSet.EMPTY);
    while(true) {
      if(i < len) {
        var G__5104 = i + 2;
        var G__5105 = cljs.core.conj_BANG_(out, items[i]);
        i = G__5104;
        out = G__5105;
        continue
      }else {
        return cljs.core.persistent_BANG_(out)
      }
      break
    }
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorStr = "cljs.core/TransientHashSet";
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__5107 = null;
  var G__5107__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__5107__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__5107 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5107__2.call(this, self__, k);
      case 3:
        return G__5107__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5107
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args5106) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5106.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  if(cljs.core._lookup.cljs$core$IFn$_invoke$arity$3(self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  return cljs.core.count(self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  self__.transient_map = cljs.core.dissoc_BANG_(self__.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  self__.transient_map = cljs.core.assoc_BANG_(self__.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_(self__.transient_map), null)
};
cljs.core.__GT_TransientHashSet = function __GT_TransientHashSet(transient_map) {
  return new cljs.core.TransientHashSet(transient_map)
};
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorStr = "cljs.core/PersistentTreeSet";
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_iset(coll);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__5110 = null;
  var G__5110__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__5110__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__5110 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5110__2.call(this, self__, k);
      case 3:
        return G__5110__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__5110
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args5109) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args5109.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.key, cljs.core.rseq(self__.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.key, cljs.core._sorted_seq(self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.cljs$core$IFn$_invoke$arity$2(cljs.core.key, cljs.core._sorted_seq_from(self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._comparator(self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys(self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count(self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3941__auto__ = cljs.core.set_QMARK_(other);
  if(and__3941__auto__) {
    var and__3941__auto____$1 = cljs.core.count(coll) === cljs.core.count(other);
    if(and__3941__auto____$1) {
      return cljs.core.every_QMARK_(function(p1__5108_SHARP_) {
        return cljs.core.contains_QMARK_(coll, p1__5108_SHARP_)
      }, other)
    }else {
      return and__3941__auto____$1
    }
  }else {
    return and__3941__auto__
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.__GT_PersistentTreeSet = function __GT_PersistentTreeSet(meta, tree_map, __hash) {
  return new cljs.core.PersistentTreeSet(meta, tree_map, __hash)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.PersistentTreeMap.EMPTY, 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__5111__delegate = function(keys) {
      if(function() {
        var and__3941__auto__ = keys instanceof cljs.core.IndexedSeq;
        if(and__3941__auto__) {
          return keys.arr.length < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD
        }else {
          return and__3941__auto__
        }
      }()) {
        var karr = keys.arr;
        var klen = karr.length;
        var alen = 2 * klen;
        var arr = new Array(alen);
        var ki = 0;
        while(true) {
          if(ki < klen) {
            var ai = 2 * ki;
            arr[ai] = karr[ki];
            arr[ai + 1] = null;
            var G__5112 = ki + 1;
            ki = G__5112;
            continue
          }else {
            return cljs.core.PersistentHashSet.fromArray.cljs$core$IFn$_invoke$arity$2 ? cljs.core.PersistentHashSet.fromArray.cljs$core$IFn$_invoke$arity$2(arr, true) : cljs.core.PersistentHashSet.fromArray.call(null, arr, true)
          }
          break
        }
      }else {
        var in$ = keys;
        var out = cljs.core._as_transient(cljs.core.PersistentHashSet.EMPTY);
        while(true) {
          if(!(in$ == null)) {
            var G__5113 = in$.cljs$core$INext$_next$arity$1(in$);
            var G__5114 = out.cljs$core$ITransientCollection$_conj_BANG_$arity$2(out, in$.cljs$core$ISeq$_first$arity$1(in$));
            in$ = G__5113;
            out = G__5114;
            continue
          }else {
            return out.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(out)
          }
          break
        }
      }
    };
    var G__5111 = function(var_args) {
      var keys = null;
      if(arguments.length > 0) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5111__delegate.call(this, keys)
    };
    G__5111.cljs$lang$maxFixedArity = 0;
    G__5111.cljs$lang$applyTo = function(arglist__5115) {
      var keys = cljs.core.seq(arglist__5115);
      return G__5111__delegate(keys)
    };
    G__5111.cljs$core$IFn$_invoke$arity$variadic = G__5111__delegate;
    return G__5111
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$core$IFn$_invoke$arity$0 = hash_set__0;
  hash_set.cljs$core$IFn$_invoke$arity$variadic = hash_set__1.cljs$core$IFn$_invoke$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(arguments.length > 0) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__5116) {
    var keys = cljs.core.seq(arglist__5116);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$core$IFn$_invoke$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by(comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(arguments.length > 1) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__5117) {
    var comparator = cljs.core.first(arglist__5117);
    var keys = cljs.core.rest(arglist__5117);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$core$IFn$_invoke$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_(coll)) {
    var n = cljs.core.count(coll);
    return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(v, i) {
      var temp__4090__auto__ = cljs.core.find(smap, cljs.core.nth.cljs$core$IFn$_invoke$arity$2(v, i));
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(v, i, cljs.core.second(e))
      }else {
        return v
      }
    }, coll, cljs.core.take(n, cljs.core.iterate(cljs.core.inc, 0)))
  }else {
    return cljs.core.map.cljs$core$IFn$_invoke$arity$2(function(p1__5118_SHARP_) {
      var temp__4090__auto__ = cljs.core.find(smap, p1__5118_SHARP_);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var e = temp__4090__auto__;
        return cljs.core.second(e)
      }else {
        return p1__5118_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__5125, seen__$1) {
        while(true) {
          var vec__5126 = p__5125;
          var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5126, 0, null);
          var xs__$1 = vec__5126;
          var temp__4092__auto__ = cljs.core.seq(xs__$1);
          if(temp__4092__auto__) {
            var s = temp__4092__auto__;
            if(cljs.core.contains_QMARK_(seen__$1, f)) {
              var G__5127 = cljs.core.rest(s);
              var G__5128 = seen__$1;
              p__5125 = G__5127;
              seen__$1 = G__5128;
              continue
            }else {
              return cljs.core.cons(f, step(cljs.core.rest(s), cljs.core.conj.cljs$core$IFn$_invoke$arity$2(seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step(coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next(s__$1)) {
      var G__5129 = cljs.core.conj.cljs$core$IFn$_invoke$arity$2(ret, cljs.core.first(s__$1));
      var G__5130 = cljs.core.next(s__$1);
      ret = G__5129;
      s__$1 = G__5130;
      continue
    }else {
      return cljs.core.seq(ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(function() {
    var G__5132 = x;
    if(G__5132) {
      if(function() {
        var or__3943__auto__ = G__5132.cljs$lang$protocol_mask$partition1$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__5132.cljs$core$INamed$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return x.cljs$core$INamed$_name$arity$1(x)
  }else {
    if(cljs.core.string_QMARK_(x)) {
      return x
    }else {
      if(cljs.core.keyword_QMARK_(x)) {
        var i = x.lastIndexOf("/", x.length - 2);
        if(i < 0) {
          return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(x, 2)
        }else {
          return cljs.core.subs.cljs$core$IFn$_invoke$arity$2(x, i + 1)
        }
      }else {
        if("\ufdd0:else") {
          throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var G__5134 = x;
    if(G__5134) {
      if(function() {
        var or__3943__auto__ = G__5134.cljs$lang$protocol_mask$partition1$ & 4096;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return G__5134.cljs$core$INamed$
        }
      }()) {
        return true
      }else {
        return false
      }
    }else {
      return false
    }
  }()) {
    return x.cljs$core$INamed$_namespace$arity$1(x)
  }else {
    if(cljs.core.keyword_QMARK_(x)) {
      var i = x.lastIndexOf("/", x.length - 2);
      if(i > -1) {
        return cljs.core.subs.cljs$core$IFn$_invoke$arity$3(x, 2, i)
      }else {
        return null
      }
    }else {
      throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
    }
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY);
  var ks = cljs.core.seq(keys);
  var vs = cljs.core.seq(vals);
  while(true) {
    if(function() {
      var and__3941__auto__ = ks;
      if(and__3941__auto__) {
        return vs
      }else {
        return and__3941__auto__
      }
    }()) {
      var G__5135 = cljs.core.assoc_BANG_(map, cljs.core.first(ks), cljs.core.first(vs));
      var G__5136 = cljs.core.next(ks);
      var G__5137 = cljs.core.next(vs);
      map = G__5135;
      ks = G__5136;
      vs = G__5137;
      continue
    }else {
      return cljs.core.persistent_BANG_(map)
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if((k.cljs$core$IFn$_invoke$arity$1 ? k.cljs$core$IFn$_invoke$arity$1(x) : k.call(null, x)) > (k.cljs$core$IFn$_invoke$arity$1 ? k.cljs$core$IFn$_invoke$arity$1(y) : k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__5140__delegate = function(k, x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5138_SHARP_, p2__5139_SHARP_) {
        return max_key.cljs$core$IFn$_invoke$arity$3(k, p1__5138_SHARP_, p2__5139_SHARP_)
      }, max_key.cljs$core$IFn$_invoke$arity$3(k, x, y), more)
    };
    var G__5140 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5140__delegate.call(this, k, x, y, more)
    };
    G__5140.cljs$lang$maxFixedArity = 3;
    G__5140.cljs$lang$applyTo = function(arglist__5141) {
      var k = cljs.core.first(arglist__5141);
      arglist__5141 = cljs.core.next(arglist__5141);
      var x = cljs.core.first(arglist__5141);
      arglist__5141 = cljs.core.next(arglist__5141);
      var y = cljs.core.first(arglist__5141);
      var more = cljs.core.rest(arglist__5141);
      return G__5140__delegate(k, x, y, more)
    };
    G__5140.cljs$core$IFn$_invoke$arity$variadic = G__5140__delegate;
    return G__5140
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$core$IFn$_invoke$arity$2 = max_key__2;
  max_key.cljs$core$IFn$_invoke$arity$3 = max_key__3;
  max_key.cljs$core$IFn$_invoke$arity$variadic = max_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if((k.cljs$core$IFn$_invoke$arity$1 ? k.cljs$core$IFn$_invoke$arity$1(x) : k.call(null, x)) < (k.cljs$core$IFn$_invoke$arity$1 ? k.cljs$core$IFn$_invoke$arity$1(y) : k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__5144__delegate = function(k, x, y, more) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5142_SHARP_, p2__5143_SHARP_) {
        return min_key.cljs$core$IFn$_invoke$arity$3(k, p1__5142_SHARP_, p2__5143_SHARP_)
      }, min_key.cljs$core$IFn$_invoke$arity$3(k, x, y), more)
    };
    var G__5144 = function(k, x, y, var_args) {
      var more = null;
      if(arguments.length > 3) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5144__delegate.call(this, k, x, y, more)
    };
    G__5144.cljs$lang$maxFixedArity = 3;
    G__5144.cljs$lang$applyTo = function(arglist__5145) {
      var k = cljs.core.first(arglist__5145);
      arglist__5145 = cljs.core.next(arglist__5145);
      var x = cljs.core.first(arglist__5145);
      arglist__5145 = cljs.core.next(arglist__5145);
      var y = cljs.core.first(arglist__5145);
      var more = cljs.core.rest(arglist__5145);
      return G__5144__delegate(k, x, y, more)
    };
    G__5144.cljs$core$IFn$_invoke$arity$variadic = G__5144__delegate;
    return G__5144
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$core$IFn$_invoke$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$core$IFn$_invoke$arity$2 = min_key__2;
  min_key.cljs$core$IFn$_invoke$arity$3 = min_key__3;
  min_key.cljs$core$IFn$_invoke$arity$variadic = min_key__4.cljs$core$IFn$_invoke$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.cljs$core$IFn$_invoke$arity$3(n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return cljs.core.cons(cljs.core.take(n, s), partition_all.cljs$core$IFn$_invoke$arity$3(n, step, cljs.core.drop(step, s)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$core$IFn$_invoke$arity$2 = partition_all__2;
  partition_all.cljs$core$IFn$_invoke$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq(coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$1 ? pred.cljs$core$IFn$_invoke$arity$1(cljs.core.first(s)) : pred.call(null, cljs.core.first(s)))) {
        return cljs.core.cons(cljs.core.first(s), take_while(pred, cljs.core.rest(s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator(sc);
    return test.cljs$core$IFn$_invoke$arity$2 ? test.cljs$core$IFn$_invoke$arity$2(comp.cljs$core$IFn$_invoke$arity$2 ? comp.cljs$core$IFn$_invoke$arity$2(cljs.core._entry_key(sc, e), key) : comp.call(null, cljs.core._entry_key(sc, e), key), 0) : test.call(null, comp.cljs$core$IFn$_invoke$arity$2 ? comp.cljs$core$IFn$_invoke$arity$2(cljs.core._entry_key(sc, e), key) : comp.call(null, cljs.core._entry_key(sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn(sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, null, cljs.core._GT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from(sc, key, true);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__5148 = temp__4092__auto__;
        var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5148, 0, null);
        var s = vec__5148;
        if(cljs.core.truth_(include.cljs$core$IFn$_invoke$arity$1 ? include.cljs$core$IFn$_invoke$arity$1(e) : include.call(null, e))) {
          return s
        }else {
          return cljs.core.next(s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while(include, cljs.core._sorted_seq(sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from(sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__5149 = temp__4092__auto__;
      var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5149, 0, null);
      var s = vec__5149;
      return cljs.core.take_while(cljs.core.mk_bound_fn(sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn(sc, start_test, start_key).call(null, e)) ? s : cljs.core.next(s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$core$IFn$_invoke$arity$3 = subseq__3;
  subseq.cljs$core$IFn$_invoke$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn(sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, null, cljs.core._LT__EQ_, null], true).call(null, test))) {
      var temp__4092__auto__ = cljs.core._sorted_seq_from(sc, key, false);
      if(cljs.core.truth_(temp__4092__auto__)) {
        var vec__5152 = temp__4092__auto__;
        var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5152, 0, null);
        var s = vec__5152;
        if(cljs.core.truth_(include.cljs$core$IFn$_invoke$arity$1 ? include.cljs$core$IFn$_invoke$arity$1(e) : include.call(null, e))) {
          return s
        }else {
          return cljs.core.next(s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while(include, cljs.core._sorted_seq(sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto__ = cljs.core._sorted_seq_from(sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var vec__5153 = temp__4092__auto__;
      var e = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5153, 0, null);
      var s = vec__5153;
      return cljs.core.take_while(cljs.core.mk_bound_fn(sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn(sc, end_test, end_key).call(null, e)) ? s : cljs.core.next(s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$core$IFn$_invoke$arity$3 = rsubseq__3;
  rsubseq.cljs$core$IFn$_invoke$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorStr = "cljs.core/Range";
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var h__2726__auto__ = self__.__hash;
  if(!(h__2726__auto__ == null)) {
    return h__2726__auto__
  }else {
    var h__2726__auto____$1 = cljs.core.hash_coll(rng);
    self__.__hash = h__2726__auto____$1;
    return h__2726__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  return cljs.core.cons(o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var coll = this;
  return cljs.core.pr_str_STAR_(coll)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$2(rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  return cljs.core.ci_reduce.cljs$core$IFn$_invoke$arity$3(rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  if(cljs.core.not(rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  return cljs.core.equiv_sequential(rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3941__auto__ = self__.start > self__.end;
      if(and__3941__auto__) {
        return self__.step === 0
      }else {
        return and__3941__auto__
      }
    }()) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  return cljs.core.with_meta(cljs.core.List.EMPTY, self__.meta)
};
cljs.core.__GT_Range = function __GT_Range(meta, start, end, step, __hash) {
  return new cljs.core.Range(meta, start, end, step, __hash)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.cljs$core$IFn$_invoke$arity$3(0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.cljs$core$IFn$_invoke$arity$3(0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.cljs$core$IFn$_invoke$arity$3(start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$core$IFn$_invoke$arity$0 = range__0;
  range.cljs$core$IFn$_invoke$arity$1 = range__1;
  range.cljs$core$IFn$_invoke$arity$2 = range__2;
  range.cljs$core$IFn$_invoke$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq(coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      return cljs.core.cons(cljs.core.first(s), take_nth(n, cljs.core.drop(n, s)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while(pred, coll), cljs.core.drop_while(pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto__ = cljs.core.seq(coll);
    if(temp__4092__auto__) {
      var s = temp__4092__auto__;
      var fst = cljs.core.first(s);
      var fv = f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(fst) : f.call(null, fst);
      var run = cljs.core.cons(fst, cljs.core.take_while(function(fst, fv) {
        return function(p1__5154_SHARP_) {
          return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(fv, f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(p1__5154_SHARP_) : f.call(null, p1__5154_SHARP_))
        }
      }(fst, fv), cljs.core.next(s)));
      return cljs.core.cons(run, partition_by(f, cljs.core.seq(cljs.core.drop(cljs.core.count(run), s))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_(cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(counts, x) {
    return cljs.core.assoc_BANG_(counts, x, cljs.core.get.cljs$core$IFn$_invoke$arity$3(counts, x, 0) + 1)
  }, cljs.core.transient$(cljs.core.PersistentArrayMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto__ = cljs.core.seq(coll);
      if(temp__4090__auto__) {
        var s = temp__4090__auto__;
        return reductions.cljs$core$IFn$_invoke$arity$3(f, cljs.core.first(s), cljs.core.rest(s))
      }else {
        return cljs.core.list.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)], 0))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons(init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto__ = cljs.core.seq(coll);
      if(temp__4092__auto__) {
        var s = temp__4092__auto__;
        return reductions.cljs$core$IFn$_invoke$arity$3(f, f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(init, cljs.core.first(s)) : f.call(null, init, cljs.core.first(s)), cljs.core.rest(s))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$core$IFn$_invoke$arity$2 = reductions__2;
  reductions.cljs$core$IFn$_invoke$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__5165 = null;
      var G__5165__0 = function() {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null)], 0))
      };
      var G__5165__1 = function(x) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null, x)], 0))
      };
      var G__5165__2 = function(x, y) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(x, y) : f.call(null, x, y)], 0))
      };
      var G__5165__3 = function(x, y, z) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(x, y, z) : f.call(null, x, y, z)], 0))
      };
      var G__5165__4 = function() {
        var G__5166__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, x, y, z, args)], 0))
        };
        var G__5166 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5166__delegate.call(this, x, y, z, args)
        };
        G__5166.cljs$lang$maxFixedArity = 3;
        G__5166.cljs$lang$applyTo = function(arglist__5167) {
          var x = cljs.core.first(arglist__5167);
          arglist__5167 = cljs.core.next(arglist__5167);
          var y = cljs.core.first(arglist__5167);
          arglist__5167 = cljs.core.next(arglist__5167);
          var z = cljs.core.first(arglist__5167);
          var args = cljs.core.rest(arglist__5167);
          return G__5166__delegate(x, y, z, args)
        };
        G__5166.cljs$core$IFn$_invoke$arity$variadic = G__5166__delegate;
        return G__5166
      }();
      G__5165 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5165__0.call(this);
          case 1:
            return G__5165__1.call(this, x);
          case 2:
            return G__5165__2.call(this, x, y);
          case 3:
            return G__5165__3.call(this, x, y, z);
          default:
            return G__5165__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__5165.cljs$lang$maxFixedArity = 3;
      G__5165.cljs$lang$applyTo = G__5165__4.cljs$lang$applyTo;
      return G__5165
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__5168 = null;
      var G__5168__0 = function() {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null), g.cljs$core$IFn$_invoke$arity$0 ? g.cljs$core$IFn$_invoke$arity$0() : g.call(null)], 0))
      };
      var G__5168__1 = function(x) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null, x), g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(x) : g.call(null, x)], 0))
      };
      var G__5168__2 = function(x, y) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(x, y) : f.call(null, x, y), g.cljs$core$IFn$_invoke$arity$2 ? g.cljs$core$IFn$_invoke$arity$2(x, y) : g.call(null, x, y)], 0))
      };
      var G__5168__3 = function(x, y, z) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(x, y, z) : f.call(null, x, y, z), g.cljs$core$IFn$_invoke$arity$3 ? g.cljs$core$IFn$_invoke$arity$3(x, y, z) : g.call(null, x, y, z)], 0))
      };
      var G__5168__4 = function() {
        var G__5169__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, x, y, z, args), cljs.core.apply.cljs$core$IFn$_invoke$arity$5(g, x, y, z, args)], 0))
        };
        var G__5169 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5169__delegate.call(this, x, y, z, args)
        };
        G__5169.cljs$lang$maxFixedArity = 3;
        G__5169.cljs$lang$applyTo = function(arglist__5170) {
          var x = cljs.core.first(arglist__5170);
          arglist__5170 = cljs.core.next(arglist__5170);
          var y = cljs.core.first(arglist__5170);
          arglist__5170 = cljs.core.next(arglist__5170);
          var z = cljs.core.first(arglist__5170);
          var args = cljs.core.rest(arglist__5170);
          return G__5169__delegate(x, y, z, args)
        };
        G__5169.cljs$core$IFn$_invoke$arity$variadic = G__5169__delegate;
        return G__5169
      }();
      G__5168 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5168__0.call(this);
          case 1:
            return G__5168__1.call(this, x);
          case 2:
            return G__5168__2.call(this, x, y);
          case 3:
            return G__5168__3.call(this, x, y, z);
          default:
            return G__5168__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__5168.cljs$lang$maxFixedArity = 3;
      G__5168.cljs$lang$applyTo = G__5168__4.cljs$lang$applyTo;
      return G__5168
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__5171 = null;
      var G__5171__0 = function() {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null), g.cljs$core$IFn$_invoke$arity$0 ? g.cljs$core$IFn$_invoke$arity$0() : g.call(null), h.cljs$core$IFn$_invoke$arity$0 ? h.cljs$core$IFn$_invoke$arity$0() : h.call(null)], 0))
      };
      var G__5171__1 = function(x) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null, x), g.cljs$core$IFn$_invoke$arity$1 ? g.cljs$core$IFn$_invoke$arity$1(x) : g.call(null, x), h.cljs$core$IFn$_invoke$arity$1 ? h.cljs$core$IFn$_invoke$arity$1(x) : h.call(null, x)], 0))
      };
      var G__5171__2 = function(x, y) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(x, y) : f.call(null, x, y), g.cljs$core$IFn$_invoke$arity$2 ? g.cljs$core$IFn$_invoke$arity$2(x, y) : g.call(null, x, y), h.cljs$core$IFn$_invoke$arity$2 ? h.cljs$core$IFn$_invoke$arity$2(x, y) : h.call(null, x, y)], 0))
      };
      var G__5171__3 = function(x, y, z) {
        return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(x, y, z) : f.call(null, x, y, z), g.cljs$core$IFn$_invoke$arity$3 ? g.cljs$core$IFn$_invoke$arity$3(x, y, z) : g.call(null, x, y, z), h.cljs$core$IFn$_invoke$arity$3 ? h.cljs$core$IFn$_invoke$arity$3(x, y, z) : h.call(null, x, y, z)], 0))
      };
      var G__5171__4 = function() {
        var G__5172__delegate = function(x, y, z, args) {
          return cljs.core.vector.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$core$IFn$_invoke$arity$5(f, x, y, z, args), cljs.core.apply.cljs$core$IFn$_invoke$arity$5(g, x, y, z, args), cljs.core.apply.cljs$core$IFn$_invoke$arity$5(h, x, y, z, args)], 0))
        };
        var G__5172 = function(x, y, z, var_args) {
          var args = null;
          if(arguments.length > 3) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5172__delegate.call(this, x, y, z, args)
        };
        G__5172.cljs$lang$maxFixedArity = 3;
        G__5172.cljs$lang$applyTo = function(arglist__5173) {
          var x = cljs.core.first(arglist__5173);
          arglist__5173 = cljs.core.next(arglist__5173);
          var y = cljs.core.first(arglist__5173);
          arglist__5173 = cljs.core.next(arglist__5173);
          var z = cljs.core.first(arglist__5173);
          var args = cljs.core.rest(arglist__5173);
          return G__5172__delegate(x, y, z, args)
        };
        G__5172.cljs$core$IFn$_invoke$arity$variadic = G__5172__delegate;
        return G__5172
      }();
      G__5171 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5171__0.call(this);
          case 1:
            return G__5171__1.call(this, x);
          case 2:
            return G__5171__2.call(this, x, y);
          case 3:
            return G__5171__3.call(this, x, y, z);
          default:
            return G__5171__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__5171.cljs$lang$maxFixedArity = 3;
      G__5171.cljs$lang$applyTo = G__5171__4.cljs$lang$applyTo;
      return G__5171
    }()
  };
  var juxt__4 = function() {
    var G__5174__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.cljs$core$IFn$_invoke$arity$4(f, g, h, fs);
      return function() {
        var G__5175 = null;
        var G__5175__0 = function() {
          return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5155_SHARP_, p2__5156_SHARP_) {
            return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__5155_SHARP_, p2__5156_SHARP_.cljs$core$IFn$_invoke$arity$0 ? p2__5156_SHARP_.cljs$core$IFn$_invoke$arity$0() : p2__5156_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__5175__1 = function(x) {
          return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5157_SHARP_, p2__5158_SHARP_) {
            return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__5157_SHARP_, p2__5158_SHARP_.cljs$core$IFn$_invoke$arity$1 ? p2__5158_SHARP_.cljs$core$IFn$_invoke$arity$1(x) : p2__5158_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__5175__2 = function(x, y) {
          return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5159_SHARP_, p2__5160_SHARP_) {
            return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__5159_SHARP_, p2__5160_SHARP_.cljs$core$IFn$_invoke$arity$2 ? p2__5160_SHARP_.cljs$core$IFn$_invoke$arity$2(x, y) : p2__5160_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__5175__3 = function(x, y, z) {
          return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5161_SHARP_, p2__5162_SHARP_) {
            return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__5161_SHARP_, p2__5162_SHARP_.cljs$core$IFn$_invoke$arity$3 ? p2__5162_SHARP_.cljs$core$IFn$_invoke$arity$3(x, y, z) : p2__5162_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__5175__4 = function() {
          var G__5176__delegate = function(x, y, z, args) {
            return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5163_SHARP_, p2__5164_SHARP_) {
              return cljs.core.conj.cljs$core$IFn$_invoke$arity$2(p1__5163_SHARP_, cljs.core.apply.cljs$core$IFn$_invoke$arity$5(p2__5164_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__5176 = function(x, y, z, var_args) {
            var args = null;
            if(arguments.length > 3) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5176__delegate.call(this, x, y, z, args)
          };
          G__5176.cljs$lang$maxFixedArity = 3;
          G__5176.cljs$lang$applyTo = function(arglist__5177) {
            var x = cljs.core.first(arglist__5177);
            arglist__5177 = cljs.core.next(arglist__5177);
            var y = cljs.core.first(arglist__5177);
            arglist__5177 = cljs.core.next(arglist__5177);
            var z = cljs.core.first(arglist__5177);
            var args = cljs.core.rest(arglist__5177);
            return G__5176__delegate(x, y, z, args)
          };
          G__5176.cljs$core$IFn$_invoke$arity$variadic = G__5176__delegate;
          return G__5176
        }();
        G__5175 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__5175__0.call(this);
            case 1:
              return G__5175__1.call(this, x);
            case 2:
              return G__5175__2.call(this, x, y);
            case 3:
              return G__5175__3.call(this, x, y, z);
            default:
              return G__5175__4.cljs$core$IFn$_invoke$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__5175.cljs$lang$maxFixedArity = 3;
        G__5175.cljs$lang$applyTo = G__5175__4.cljs$lang$applyTo;
        return G__5175
      }()
    };
    var G__5174 = function(f, g, h, var_args) {
      var fs = null;
      if(arguments.length > 3) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5174__delegate.call(this, f, g, h, fs)
    };
    G__5174.cljs$lang$maxFixedArity = 3;
    G__5174.cljs$lang$applyTo = function(arglist__5178) {
      var f = cljs.core.first(arglist__5178);
      arglist__5178 = cljs.core.next(arglist__5178);
      var g = cljs.core.first(arglist__5178);
      arglist__5178 = cljs.core.next(arglist__5178);
      var h = cljs.core.first(arglist__5178);
      var fs = cljs.core.rest(arglist__5178);
      return G__5174__delegate(f, g, h, fs)
    };
    G__5174.cljs$core$IFn$_invoke$arity$variadic = G__5174__delegate;
    return G__5174
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$core$IFn$_invoke$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$core$IFn$_invoke$arity$1 = juxt__1;
  juxt.cljs$core$IFn$_invoke$arity$2 = juxt__2;
  juxt.cljs$core$IFn$_invoke$arity$3 = juxt__3;
  juxt.cljs$core$IFn$_invoke$arity$variadic = juxt__4.cljs$core$IFn$_invoke$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq(coll)) {
        var G__5179 = cljs.core.next(coll);
        coll = G__5179;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = cljs.core.seq(coll);
        if(and__3941__auto__) {
          return n > 0
        }else {
          return and__3941__auto__
        }
      }())) {
        var G__5180 = n - 1;
        var G__5181 = cljs.core.next(coll);
        n = G__5180;
        coll = G__5181;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$core$IFn$_invoke$arity$1 = dorun__1;
  dorun.cljs$core$IFn$_invoke$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.cljs$core$IFn$_invoke$arity$1(coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.cljs$core$IFn$_invoke$arity$2(n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$core$IFn$_invoke$arity$1 = doall__1;
  doall.cljs$core$IFn$_invoke$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.first(matches), s)) {
    if(cljs.core.count(matches) === 1) {
      return cljs.core.first(matches)
    }else {
      return cljs.core.vec(matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count(matches) === 1) {
      return cljs.core.first(matches)
    }else {
      return cljs.core.vec(matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find(re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_(match_data) ? cljs.core.first(match_data) : match_data;
  var post_match = cljs.core.subs.cljs$core$IFn$_invoke$arity$2(s, match_idx + cljs.core.count(match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons(match_data, re_seq(re, post_match))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__5183 = cljs.core.re_find(/^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5183, 0, null);
  var flags = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5183, 1, null);
  var pattern = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5183, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write(writer, begin);
  if(cljs.core.seq(coll)) {
    print_one.cljs$core$IFn$_invoke$arity$3 ? print_one.cljs$core$IFn$_invoke$arity$3(cljs.core.first(coll), writer, opts) : print_one.call(null, cljs.core.first(coll), writer, opts)
  }else {
  }
  var seq__5188_5192 = cljs.core.seq(cljs.core.next(coll));
  var chunk__5189_5193 = null;
  var count__5190_5194 = 0;
  var i__5191_5195 = 0;
  while(true) {
    if(i__5191_5195 < count__5190_5194) {
      var o_5196 = chunk__5189_5193.cljs$core$IIndexed$_nth$arity$2(chunk__5189_5193, i__5191_5195);
      cljs.core._write(writer, sep);
      print_one.cljs$core$IFn$_invoke$arity$3 ? print_one.cljs$core$IFn$_invoke$arity$3(o_5196, writer, opts) : print_one.call(null, o_5196, writer, opts);
      var G__5197 = seq__5188_5192;
      var G__5198 = chunk__5189_5193;
      var G__5199 = count__5190_5194;
      var G__5200 = i__5191_5195 + 1;
      seq__5188_5192 = G__5197;
      chunk__5189_5193 = G__5198;
      count__5190_5194 = G__5199;
      i__5191_5195 = G__5200;
      continue
    }else {
      var temp__4092__auto___5201 = cljs.core.seq(seq__5188_5192);
      if(temp__4092__auto___5201) {
        var seq__5188_5202__$1 = temp__4092__auto___5201;
        if(cljs.core.chunked_seq_QMARK_(seq__5188_5202__$1)) {
          var c__3031__auto___5203 = cljs.core.chunk_first(seq__5188_5202__$1);
          var G__5204 = cljs.core.chunk_rest(seq__5188_5202__$1);
          var G__5205 = c__3031__auto___5203;
          var G__5206 = cljs.core.count(c__3031__auto___5203);
          var G__5207 = 0;
          seq__5188_5192 = G__5204;
          chunk__5189_5193 = G__5205;
          count__5190_5194 = G__5206;
          i__5191_5195 = G__5207;
          continue
        }else {
          var o_5208 = cljs.core.first(seq__5188_5202__$1);
          cljs.core._write(writer, sep);
          print_one.cljs$core$IFn$_invoke$arity$3 ? print_one.cljs$core$IFn$_invoke$arity$3(o_5208, writer, opts) : print_one.call(null, o_5208, writer, opts);
          var G__5209 = cljs.core.next(seq__5188_5202__$1);
          var G__5210 = null;
          var G__5211 = 0;
          var G__5212 = 0;
          seq__5188_5192 = G__5209;
          chunk__5189_5193 = G__5210;
          count__5190_5194 = G__5211;
          i__5191_5195 = G__5212;
          continue
        }
      }else {
      }
    }
    break
  }
  return cljs.core._write(writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var seq__5217 = cljs.core.seq(ss);
    var chunk__5218 = null;
    var count__5219 = 0;
    var i__5220 = 0;
    while(true) {
      if(i__5220 < count__5219) {
        var s = chunk__5218.cljs$core$IIndexed$_nth$arity$2(chunk__5218, i__5220);
        cljs.core._write(writer, s);
        var G__5221 = seq__5217;
        var G__5222 = chunk__5218;
        var G__5223 = count__5219;
        var G__5224 = i__5220 + 1;
        seq__5217 = G__5221;
        chunk__5218 = G__5222;
        count__5219 = G__5223;
        i__5220 = G__5224;
        continue
      }else {
        var temp__4092__auto__ = cljs.core.seq(seq__5217);
        if(temp__4092__auto__) {
          var seq__5217__$1 = temp__4092__auto__;
          if(cljs.core.chunked_seq_QMARK_(seq__5217__$1)) {
            var c__3031__auto__ = cljs.core.chunk_first(seq__5217__$1);
            var G__5225 = cljs.core.chunk_rest(seq__5217__$1);
            var G__5226 = c__3031__auto__;
            var G__5227 = cljs.core.count(c__3031__auto__);
            var G__5228 = 0;
            seq__5217 = G__5225;
            chunk__5218 = G__5226;
            count__5219 = G__5227;
            i__5220 = G__5228;
            continue
          }else {
            var s = cljs.core.first(seq__5217__$1);
            cljs.core._write(writer, s);
            var G__5229 = cljs.core.next(seq__5217__$1);
            var G__5230 = null;
            var G__5231 = 0;
            var G__5232 = 0;
            seq__5217 = G__5229;
            chunk__5218 = G__5230;
            count__5219 = G__5231;
            i__5220 = G__5232;
            continue
          }
        }else {
          return null
        }
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(arguments.length > 1) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__5233) {
    var writer = cljs.core.first(arglist__5233);
    var ss = cljs.core.rest(arglist__5233);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$core$IFn$_invoke$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.cljs$core$IFn$_invoke$arity$1 ? cljs.core._STAR_print_fn_STAR_.cljs$core$IFn$_invoke$arity$1(x) : cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.char_escapes = {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"};
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core.char_escapes[match]
  })), cljs.core.str('"')].join("")
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write(writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write(writer, "#<undefined>")
    }else {
      if("\ufdd0:else") {
        if(cljs.core.truth_(function() {
          var and__3941__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(opts, "\ufdd0:meta");
          if(cljs.core.truth_(and__3941__auto__)) {
            var and__3941__auto____$1 = function() {
              var G__5237 = obj;
              if(G__5237) {
                if(function() {
                  var or__3943__auto__ = G__5237.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__5237.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__5237.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_(cljs.core.IMeta, G__5237)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_(cljs.core.IMeta, G__5237)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____$1)) {
              return cljs.core.meta(obj)
            }else {
              return and__3941__auto____$1
            }
          }else {
            return and__3941__auto__
          }
        }())) {
          cljs.core._write(writer, "^");
          pr_writer(cljs.core.meta(obj), writer, opts);
          cljs.core._write(writer, " ")
        }else {
        }
        if(obj == null) {
          return cljs.core._write(writer, "nil")
        }else {
          if(obj.cljs$lang$type) {
            return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
          }else {
            if(function() {
              var G__5238 = obj;
              if(G__5238) {
                if(function() {
                  var or__3943__auto__ = G__5238.cljs$lang$protocol_mask$partition0$ & 2147483648;
                  if(or__3943__auto__) {
                    return or__3943__auto__
                  }else {
                    return G__5238.cljs$core$IPrintWithWriter$
                  }
                }()) {
                  return true
                }else {
                  return false
                }
              }else {
                return false
              }
            }()) {
              return obj.cljs$core$IPrintWithWriter$_pr_writer$arity$3(obj, writer, opts)
            }else {
              if(function() {
                var or__3943__auto__ = cljs.core.type(obj) === Boolean;
                if(or__3943__auto__) {
                  return or__3943__auto__
                }else {
                  return typeof obj === "number"
                }
              }()) {
                return cljs.core._write(writer, [cljs.core.str(obj)].join(""))
              }else {
                if(obj instanceof Array) {
                  return cljs.core.pr_sequential_writer(writer, pr_writer, "#<Array [", ", ", "]>", opts, obj)
                }else {
                  if(goog.isString(obj)) {
                    if(cljs.core.keyword_QMARK_(obj)) {
                      cljs.core._write(writer, ":");
                      var temp__4092__auto___5240 = cljs.core.namespace(obj);
                      if(cljs.core.truth_(temp__4092__auto___5240)) {
                        var nspc_5241 = temp__4092__auto___5240;
                        cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer, cljs.core.array_seq([[cljs.core.str(nspc_5241)].join(""), "/"], 0))
                      }else {
                      }
                      return cljs.core._write(writer, cljs.core.name(obj))
                    }else {
                      if(obj instanceof cljs.core.Symbol) {
                        var temp__4092__auto___5242 = cljs.core.namespace(obj);
                        if(cljs.core.truth_(temp__4092__auto___5242)) {
                          var nspc_5243 = temp__4092__auto___5242;
                          cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer, cljs.core.array_seq([[cljs.core.str(nspc_5243)].join(""), "/"], 0))
                        }else {
                        }
                        return cljs.core._write(writer, cljs.core.name(obj))
                      }else {
                        if("\ufdd0:else") {
                          if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0:readably")).call(null, opts))) {
                            return cljs.core._write(writer, cljs.core.quote_string(obj))
                          }else {
                            return cljs.core._write(writer, obj)
                          }
                        }else {
                          return null
                        }
                      }
                    }
                  }else {
                    if(cljs.core.fn_QMARK_(obj)) {
                      return cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer, cljs.core.array_seq(["#<", [cljs.core.str(obj)].join(""), ">"], 0))
                    }else {
                      if(obj instanceof Date) {
                        var normalize = function(n, len) {
                          var ns = [cljs.core.str(n)].join("");
                          while(true) {
                            if(cljs.core.count(ns) < len) {
                              var G__5244 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
                              ns = G__5244;
                              continue
                            }else {
                              return ns
                            }
                            break
                          }
                        };
                        return cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer, cljs.core.array_seq(['#inst "', [cljs.core.str(obj.getUTCFullYear())].join(""), "-", normalize(obj.getUTCMonth() + 1, 2), "-", normalize(obj.getUTCDate(), 2), "T", normalize(obj.getUTCHours(), 2), ":", normalize(obj.getUTCMinutes(), 2), ":", normalize(obj.getUTCSeconds(), 2), ".", normalize(obj.getUTCMilliseconds(), 3), "-", '00:00"'], 0))
                      }else {
                        if(cljs.core.truth_(cljs.core.regexp_QMARK_(obj))) {
                          return cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer, cljs.core.array_seq(['#"', obj.source, '"'], 0))
                        }else {
                          if(function() {
                            var G__5239 = obj;
                            if(G__5239) {
                              if(function() {
                                var or__3943__auto__ = G__5239.cljs$lang$protocol_mask$partition0$ & 2147483648;
                                if(or__3943__auto__) {
                                  return or__3943__auto__
                                }else {
                                  return G__5239.cljs$core$IPrintWithWriter$
                                }
                              }()) {
                                return true
                              }else {
                                if(!G__5239.cljs$lang$protocol_mask$partition0$) {
                                  return cljs.core.type_satisfies_(cljs.core.IPrintWithWriter, G__5239)
                                }else {
                                  return false
                                }
                              }
                            }else {
                              return cljs.core.type_satisfies_(cljs.core.IPrintWithWriter, G__5239)
                            }
                          }()) {
                            return cljs.core._pr_writer(obj, writer, opts)
                          }else {
                            if("\ufdd0:else") {
                              return cljs.core.write_all.cljs$core$IFn$_invoke$arity$variadic(writer, cljs.core.array_seq(["#<", [cljs.core.str(obj)].join(""), ">"], 0))
                            }else {
                              return null
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer(cljs.core.first(objs), writer, opts);
  var seq__5249 = cljs.core.seq(cljs.core.next(objs));
  var chunk__5250 = null;
  var count__5251 = 0;
  var i__5252 = 0;
  while(true) {
    if(i__5252 < count__5251) {
      var obj = chunk__5250.cljs$core$IIndexed$_nth$arity$2(chunk__5250, i__5252);
      cljs.core._write(writer, " ");
      cljs.core.pr_writer(obj, writer, opts);
      var G__5253 = seq__5249;
      var G__5254 = chunk__5250;
      var G__5255 = count__5251;
      var G__5256 = i__5252 + 1;
      seq__5249 = G__5253;
      chunk__5250 = G__5254;
      count__5251 = G__5255;
      i__5252 = G__5256;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq(seq__5249);
      if(temp__4092__auto__) {
        var seq__5249__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_(seq__5249__$1)) {
          var c__3031__auto__ = cljs.core.chunk_first(seq__5249__$1);
          var G__5257 = cljs.core.chunk_rest(seq__5249__$1);
          var G__5258 = c__3031__auto__;
          var G__5259 = cljs.core.count(c__3031__auto__);
          var G__5260 = 0;
          seq__5249 = G__5257;
          chunk__5250 = G__5258;
          count__5251 = G__5259;
          i__5252 = G__5260;
          continue
        }else {
          var obj = cljs.core.first(seq__5249__$1);
          cljs.core._write(writer, " ");
          cljs.core.pr_writer(obj, writer, opts);
          var G__5261 = cljs.core.next(seq__5249__$1);
          var G__5262 = null;
          var G__5263 = 0;
          var G__5264 = 0;
          seq__5249 = G__5261;
          chunk__5250 = G__5262;
          count__5251 = G__5263;
          i__5252 = G__5264;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer(objs, writer, opts);
  cljs.core._flush(writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_(objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts(objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_(objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts(objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print(cljs.core.pr_str_with_opts(objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print("\n");
  if(cljs.core.truth_(cljs.core.get.cljs$core$IFn$_invoke$arity$2(opts, "\ufdd0:flush-on-newline"))) {
    return cljs.core.flush()
  }else {
    return null
  }
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts(objs, cljs.core.pr_opts())
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__5265) {
    var objs = cljs.core.seq(arglist__5265);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$core$IFn$_invoke$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts(objs, cljs.core.pr_opts())
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__5266) {
    var objs = cljs.core.seq(arglist__5266);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$core$IFn$_invoke$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts(objs, cljs.core.pr_opts())
  };
  var pr = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__5267) {
    var objs = cljs.core.seq(arglist__5267);
    return pr__delegate(objs)
  };
  pr.cljs$core$IFn$_invoke$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts(objs, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.pr_opts(), "\ufdd0:readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__5268) {
    var objs = cljs.core.seq(arglist__5268);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$core$IFn$_invoke$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts(objs, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.pr_opts(), "\ufdd0:readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__5269) {
    var objs = cljs.core.seq(arglist__5269);
    return print_str__delegate(objs)
  };
  print_str.cljs$core$IFn$_invoke$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts(objs, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.pr_opts(), "\ufdd0:readably", false));
    return cljs.core.newline(cljs.core.pr_opts())
  };
  var println = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__5270) {
    var objs = cljs.core.seq(arglist__5270);
    return println__delegate(objs)
  };
  println.cljs$core$IFn$_invoke$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts(objs, cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(cljs.core.pr_opts(), "\ufdd0:readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__5271) {
    var objs = cljs.core.seq(arglist__5271);
    return println_str__delegate(objs)
  };
  println_str.cljs$core$IFn$_invoke$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts(objs, cljs.core.pr_opts());
    return cljs.core.newline(cljs.core.pr_opts())
  };
  var prn = function(var_args) {
    var objs = null;
    if(arguments.length > 0) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__5272) {
    var objs = cljs.core.seq(arglist__5272);
    return prn__delegate(objs)
  };
  prn.cljs$core$IFn$_invoke$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.format, fmt, args)], 0))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__5273) {
    var fmt = cljs.core.first(arglist__5273);
    var args = cljs.core.rest(arglist__5273);
    return printf__delegate(fmt, args)
  };
  printf.cljs$core$IFn$_invoke$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.KeySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.KeySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer(writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer(writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq(coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer(writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write(writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ValSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ValSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer(writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.cljs$core$IFn$_invoke$arity$2(x, y)
};
cljs.core.Subvec.prototype.cljs$core$IComparable$ = true;
cljs.core.Subvec.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.cljs$core$IFn$_invoke$arity$2(x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2153938944;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorStr = "cljs.core/Atom";
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var seq__5274 = cljs.core.seq(self__.watches);
  var chunk__5275 = null;
  var count__5276 = 0;
  var i__5277 = 0;
  while(true) {
    if(i__5277 < count__5276) {
      var vec__5278 = chunk__5275.cljs$core$IIndexed$_nth$arity$2(chunk__5275, i__5277);
      var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5278, 0, null);
      var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5278, 1, null);
      f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(key, this$, oldval, newval) : f.call(null, key, this$, oldval, newval);
      var G__5280 = seq__5274;
      var G__5281 = chunk__5275;
      var G__5282 = count__5276;
      var G__5283 = i__5277 + 1;
      seq__5274 = G__5280;
      chunk__5275 = G__5281;
      count__5276 = G__5282;
      i__5277 = G__5283;
      continue
    }else {
      var temp__4092__auto__ = cljs.core.seq(seq__5274);
      if(temp__4092__auto__) {
        var seq__5274__$1 = temp__4092__auto__;
        if(cljs.core.chunked_seq_QMARK_(seq__5274__$1)) {
          var c__3031__auto__ = cljs.core.chunk_first(seq__5274__$1);
          var G__5284 = cljs.core.chunk_rest(seq__5274__$1);
          var G__5285 = c__3031__auto__;
          var G__5286 = cljs.core.count(c__3031__auto__);
          var G__5287 = 0;
          seq__5274 = G__5284;
          chunk__5275 = G__5285;
          count__5276 = G__5286;
          i__5277 = G__5287;
          continue
        }else {
          var vec__5279 = cljs.core.first(seq__5274__$1);
          var key = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5279, 0, null);
          var f = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5279, 1, null);
          f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(key, this$, oldval, newval) : f.call(null, key, this$, oldval, newval);
          var G__5288 = cljs.core.next(seq__5274__$1);
          var G__5289 = null;
          var G__5290 = 0;
          var G__5291 = 0;
          seq__5274 = G__5288;
          chunk__5275 = G__5289;
          count__5276 = G__5290;
          i__5277 = G__5291;
          continue
        }
      }else {
        return null
      }
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  cljs.core._write(writer, "#<Atom: ");
  cljs.core.pr_writer(self__.state, writer, opts);
  return cljs.core._write(writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return o === other
};
cljs.core.__GT_Atom = function __GT_Atom(state, meta, validator, watches) {
  return new cljs.core.Atom(state, meta, validator, watches)
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__5295__delegate = function(x, p__5292) {
      var map__5294 = p__5292;
      var map__5294__$1 = cljs.core.seq_QMARK_(map__5294) ? cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map, map__5294) : map__5294;
      var validator = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__5294__$1, "\ufdd0:validator");
      var meta = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__5294__$1, "\ufdd0:meta");
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__5295 = function(x, var_args) {
      var p__5292 = null;
      if(arguments.length > 1) {
        p__5292 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5295__delegate.call(this, x, p__5292)
    };
    G__5295.cljs$lang$maxFixedArity = 1;
    G__5295.cljs$lang$applyTo = function(arglist__5296) {
      var x = cljs.core.first(arglist__5296);
      var p__5292 = cljs.core.rest(arglist__5296);
      return G__5295__delegate(x, p__5292)
    };
    G__5295.cljs$core$IFn$_invoke$arity$variadic = G__5295__delegate;
    return G__5295
  }();
  atom = function(x, var_args) {
    var p__5292 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$core$IFn$_invoke$arity$1 = atom__1;
  atom.cljs$core$IFn$_invoke$arity$variadic = atom__2.cljs$core$IFn$_invoke$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto___5297 = a.validator;
  if(cljs.core.truth_(temp__4092__auto___5297)) {
    var validate_5298 = temp__4092__auto___5297;
    if(cljs.core.truth_(validate_5298.cljs$core$IFn$_invoke$arity$1 ? validate_5298.cljs$core$IFn$_invoke$arity$1(new_value) : validate_5298.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.list(new cljs.core.Symbol(null, "validate", "validate", 1233162959, null), new cljs.core.Symbol(null, "new-value", "new-value", 972165309, null))], 0)))].join(""));
    }
  }else {
  }
  var old_value_5299 = a.state;
  a.state = new_value;
  cljs.core._notify_watches(a, old_value_5299, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_(a, f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(a.state) : f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_(a, f.cljs$core$IFn$_invoke$arity$2 ? f.cljs$core$IFn$_invoke$arity$2(a.state, x) : f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_(a, f.cljs$core$IFn$_invoke$arity$3 ? f.cljs$core$IFn$_invoke$arity$3(a.state, x, y) : f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_(a, f.cljs$core$IFn$_invoke$arity$4 ? f.cljs$core$IFn$_invoke$arity$4(a.state, x, y, z) : f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__5300__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_(a, cljs.core.apply.cljs$core$IFn$_invoke$arity$variadic(f, a.state, x, y, z, cljs.core.array_seq([more], 0)))
    };
    var G__5300 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(arguments.length > 5) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5300__delegate.call(this, a, f, x, y, z, more)
    };
    G__5300.cljs$lang$maxFixedArity = 5;
    G__5300.cljs$lang$applyTo = function(arglist__5301) {
      var a = cljs.core.first(arglist__5301);
      arglist__5301 = cljs.core.next(arglist__5301);
      var f = cljs.core.first(arglist__5301);
      arglist__5301 = cljs.core.next(arglist__5301);
      var x = cljs.core.first(arglist__5301);
      arglist__5301 = cljs.core.next(arglist__5301);
      var y = cljs.core.first(arglist__5301);
      arglist__5301 = cljs.core.next(arglist__5301);
      var z = cljs.core.first(arglist__5301);
      var more = cljs.core.rest(arglist__5301);
      return G__5300__delegate(a, f, x, y, z, more)
    };
    G__5300.cljs$core$IFn$_invoke$arity$variadic = G__5300__delegate;
    return G__5300
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$core$IFn$_invoke$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$core$IFn$_invoke$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$core$IFn$_invoke$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$core$IFn$_invoke$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_BANG___6.cljs$core$IFn$_invoke$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(a.state, oldval)) {
    cljs.core.reset_BANG_(a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref(o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.cljs$core$IFn$_invoke$arity$3(f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(arguments.length > 2) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__5302) {
    var iref = cljs.core.first(arglist__5302);
    arglist__5302 = cljs.core.next(arglist__5302);
    var f = cljs.core.first(arglist__5302);
    var args = cljs.core.rest(arglist__5302);
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$core$IFn$_invoke$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch(iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch(iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.cljs$core$IFn$_invoke$arity$1("G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(0)
    }else {
    }
    return cljs.core.symbol.cljs$core$IFn$_invoke$arity$1([cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$core$IFn$_invoke$arity$0 = gensym__0;
  gensym.cljs$core$IFn$_invoke$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorStr = "cljs.core/Delay";
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0:done")).call(null, cljs.core.deref(self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0:value")).call(null, cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.state, function(p__5303) {
    var map__5304 = p__5303;
    var map__5304__$1 = cljs.core.seq_QMARK_(map__5304) ? cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map, map__5304) : map__5304;
    var curr_state = map__5304__$1;
    var done = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__5304__$1, "\ufdd0:done");
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:done", true, "\ufdd0:value", self__.f.cljs$core$IFn$_invoke$arity$0 ? self__.f.cljs$core$IFn$_invoke$arity$0() : self__.f.call(null)], true)
    }
  }))
};
cljs.core.__GT_Delay = function __GT_Delay(state, f) {
  return new cljs.core.Delay(state, f)
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return x instanceof cljs.core.Delay
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_(x)) {
    return cljs.core.deref(x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_(d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__2900__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IEncodeJS.-clj->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__2900__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._key__GT_js[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IEncodeJS.-key->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.key__GT_js = function key__GT_js(k) {
  if(function() {
    var G__5306 = k;
    if(G__5306) {
      if(cljs.core.truth_(function() {
        var or__3943__auto__ = null;
        if(cljs.core.truth_(or__3943__auto__)) {
          return or__3943__auto__
        }else {
          return G__5306.cljs$core$IEncodeJS$
        }
      }())) {
        return true
      }else {
        if(!G__5306.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_(cljs.core.IEncodeJS, G__5306)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_(cljs.core.IEncodeJS, G__5306)
    }
  }()) {
    return cljs.core._clj__GT_js(k)
  }else {
    if(function() {
      var or__3943__auto__ = cljs.core.string_QMARK_(k);
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = typeof k === "number";
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          var or__3943__auto____$2 = cljs.core.keyword_QMARK_(k);
          if(or__3943__auto____$2) {
            return or__3943__auto____$2
          }else {
            return k instanceof cljs.core.Symbol
          }
        }
      }
    }()) {
      return cljs.core.clj__GT_js.cljs$core$IFn$_invoke$arity$1 ? cljs.core.clj__GT_js.cljs$core$IFn$_invoke$arity$1(k) : cljs.core.clj__GT_js.call(null, k)
    }else {
      return cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([k], 0))
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  if(x == null) {
    return null
  }else {
    if(function() {
      var G__5314 = x;
      if(G__5314) {
        if(cljs.core.truth_(function() {
          var or__3943__auto__ = null;
          if(cljs.core.truth_(or__3943__auto__)) {
            return or__3943__auto__
          }else {
            return G__5314.cljs$core$IEncodeJS$
          }
        }())) {
          return true
        }else {
          if(!G__5314.cljs$lang$protocol_mask$partition$) {
            return cljs.core.type_satisfies_(cljs.core.IEncodeJS, G__5314)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_(cljs.core.IEncodeJS, G__5314)
      }
    }()) {
      return cljs.core._clj__GT_js(x)
    }else {
      if(cljs.core.keyword_QMARK_(x)) {
        return cljs.core.name(x)
      }else {
        if(x instanceof cljs.core.Symbol) {
          return[cljs.core.str(x)].join("")
        }else {
          if(cljs.core.map_QMARK_(x)) {
            var m = {};
            var seq__5315_5321 = cljs.core.seq(x);
            var chunk__5316_5322 = null;
            var count__5317_5323 = 0;
            var i__5318_5324 = 0;
            while(true) {
              if(i__5318_5324 < count__5317_5323) {
                var vec__5319_5325 = chunk__5316_5322.cljs$core$IIndexed$_nth$arity$2(chunk__5316_5322, i__5318_5324);
                var k_5326 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5319_5325, 0, null);
                var v_5327 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5319_5325, 1, null);
                m[cljs.core.key__GT_js(k_5326)] = clj__GT_js(v_5327);
                var G__5328 = seq__5315_5321;
                var G__5329 = chunk__5316_5322;
                var G__5330 = count__5317_5323;
                var G__5331 = i__5318_5324 + 1;
                seq__5315_5321 = G__5328;
                chunk__5316_5322 = G__5329;
                count__5317_5323 = G__5330;
                i__5318_5324 = G__5331;
                continue
              }else {
                var temp__4092__auto___5332 = cljs.core.seq(seq__5315_5321);
                if(temp__4092__auto___5332) {
                  var seq__5315_5333__$1 = temp__4092__auto___5332;
                  if(cljs.core.chunked_seq_QMARK_(seq__5315_5333__$1)) {
                    var c__3031__auto___5334 = cljs.core.chunk_first(seq__5315_5333__$1);
                    var G__5335 = cljs.core.chunk_rest(seq__5315_5333__$1);
                    var G__5336 = c__3031__auto___5334;
                    var G__5337 = cljs.core.count(c__3031__auto___5334);
                    var G__5338 = 0;
                    seq__5315_5321 = G__5335;
                    chunk__5316_5322 = G__5336;
                    count__5317_5323 = G__5337;
                    i__5318_5324 = G__5338;
                    continue
                  }else {
                    var vec__5320_5339 = cljs.core.first(seq__5315_5333__$1);
                    var k_5340 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5320_5339, 0, null);
                    var v_5341 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5320_5339, 1, null);
                    m[cljs.core.key__GT_js(k_5340)] = clj__GT_js(v_5341);
                    var G__5342 = cljs.core.next(seq__5315_5333__$1);
                    var G__5343 = null;
                    var G__5344 = 0;
                    var G__5345 = 0;
                    seq__5315_5321 = G__5342;
                    chunk__5316_5322 = G__5343;
                    count__5317_5323 = G__5344;
                    i__5318_5324 = G__5345;
                    continue
                  }
                }else {
                }
              }
              break
            }
            return m
          }else {
            if(cljs.core.coll_QMARK_(x)) {
              return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array, cljs.core.map.cljs$core$IFn$_invoke$arity$2(clj__GT_js, x))
            }else {
              if("\ufdd0:else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function _js__GT_clj(x, options) {
  if(function() {
    var and__3941__auto__ = x;
    if(and__3941__auto__) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
  }else {
    var x__2900__auto__ = x == null ? null : x;
    return function() {
      var or__3943__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._js__GT_clj["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IEncodeClojure.-js->clj", x);
        }
      }
    }().call(null, x, options)
  }
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj = null;
  var js__GT_clj__1 = function(x) {
    return js__GT_clj.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq([cljs.core.PersistentArrayMap.fromArray(["\ufdd0:keywordize-keys", false], true)], 0))
  };
  var js__GT_clj__2 = function() {
    var G__5366__delegate = function(x, opts) {
      if(function() {
        var G__5356 = cljs.core.IEncodeClojure;
        if(G__5356) {
          if(cljs.core.truth_(function() {
            var or__3943__auto__ = null;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return G__5356.cljs$core$x$
            }
          }())) {
            return true
          }else {
            if(!G__5356.cljs$lang$protocol_mask$partition$) {
              return cljs.core.type_satisfies_(x, G__5356)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_(x, G__5356)
        }
      }()) {
        return cljs.core._js__GT_clj(x, cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.array_map, opts))
      }else {
        if(cljs.core.seq(opts)) {
          var map__5357 = opts;
          var map__5357__$1 = cljs.core.seq_QMARK_(map__5357) ? cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map, map__5357) : map__5357;
          var keywordize_keys = cljs.core.get.cljs$core$IFn$_invoke$arity$2(map__5357__$1, "\ufdd0:keywordize-keys");
          var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
          var f = function(map__5357, map__5357__$1, keywordize_keys, keyfn) {
            return function thisfn(x__$1) {
              if(cljs.core.seq_QMARK_(x__$1)) {
                return cljs.core.doall.cljs$core$IFn$_invoke$arity$1(cljs.core.map.cljs$core$IFn$_invoke$arity$2(thisfn, x__$1))
              }else {
                if(cljs.core.coll_QMARK_(x__$1)) {
                  return cljs.core.into(cljs.core.empty(x__$1), cljs.core.map.cljs$core$IFn$_invoke$arity$2(thisfn, x__$1))
                }else {
                  if(x__$1 instanceof Array) {
                    return cljs.core.vec(cljs.core.map.cljs$core$IFn$_invoke$arity$2(thisfn, x__$1))
                  }else {
                    if(cljs.core.type(x__$1) === Object) {
                      return cljs.core.into(cljs.core.PersistentArrayMap.EMPTY, function() {
                        var iter__3000__auto__ = function(map__5357, map__5357__$1, keywordize_keys, keyfn) {
                          return function iter__5362(s__5363) {
                            return new cljs.core.LazySeq(null, false, function(map__5357, map__5357__$1, keywordize_keys, keyfn) {
                              return function() {
                                var s__5363__$1 = s__5363;
                                while(true) {
                                  var temp__4092__auto__ = cljs.core.seq(s__5363__$1);
                                  if(temp__4092__auto__) {
                                    var s__5363__$2 = temp__4092__auto__;
                                    if(cljs.core.chunked_seq_QMARK_(s__5363__$2)) {
                                      var c__2998__auto__ = cljs.core.chunk_first(s__5363__$2);
                                      var size__2999__auto__ = cljs.core.count(c__2998__auto__);
                                      var b__5365 = cljs.core.chunk_buffer(size__2999__auto__);
                                      if(function() {
                                        var i__5364 = 0;
                                        while(true) {
                                          if(i__5364 < size__2999__auto__) {
                                            var k = cljs.core._nth.cljs$core$IFn$_invoke$arity$2(c__2998__auto__, i__5364);
                                            cljs.core.chunk_append(b__5365, cljs.core.PersistentVector.fromArray([keyfn.cljs$core$IFn$_invoke$arity$1 ? keyfn.cljs$core$IFn$_invoke$arity$1(k) : keyfn.call(null, k), thisfn(x__$1[k])], true));
                                            var G__5367 = i__5364 + 1;
                                            i__5364 = G__5367;
                                            continue
                                          }else {
                                            return true
                                          }
                                          break
                                        }
                                      }()) {
                                        return cljs.core.chunk_cons(cljs.core.chunk(b__5365), iter__5362(cljs.core.chunk_rest(s__5363__$2)))
                                      }else {
                                        return cljs.core.chunk_cons(cljs.core.chunk(b__5365), null)
                                      }
                                    }else {
                                      var k = cljs.core.first(s__5363__$2);
                                      return cljs.core.cons(cljs.core.PersistentVector.fromArray([keyfn.cljs$core$IFn$_invoke$arity$1 ? keyfn.cljs$core$IFn$_invoke$arity$1(k) : keyfn.call(null, k), thisfn(x__$1[k])], true), iter__5362(cljs.core.rest(s__5363__$2)))
                                    }
                                  }else {
                                    return null
                                  }
                                  break
                                }
                              }
                            }(map__5357, map__5357__$1, keywordize_keys, keyfn), null)
                          }
                        }(map__5357, map__5357__$1, keywordize_keys, keyfn);
                        return iter__3000__auto__(cljs.core.js_keys(x__$1))
                      }())
                    }else {
                      if("\ufdd0:else") {
                        return x__$1
                      }else {
                        return null
                      }
                    }
                  }
                }
              }
            }
          }(map__5357, map__5357__$1, keywordize_keys, keyfn);
          return f(x)
        }else {
          return null
        }
      }
    };
    var G__5366 = function(x, var_args) {
      var opts = null;
      if(arguments.length > 1) {
        opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5366__delegate.call(this, x, opts)
    };
    G__5366.cljs$lang$maxFixedArity = 1;
    G__5366.cljs$lang$applyTo = function(arglist__5368) {
      var x = cljs.core.first(arglist__5368);
      var opts = cljs.core.rest(arglist__5368);
      return G__5366__delegate(x, opts)
    };
    G__5366.cljs$core$IFn$_invoke$arity$variadic = G__5366__delegate;
    return G__5366
  }();
  js__GT_clj = function(x, var_args) {
    var opts = var_args;
    switch(arguments.length) {
      case 1:
        return js__GT_clj__1.call(this, x);
      default:
        return js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = js__GT_clj__2.cljs$lang$applyTo;
  js__GT_clj.cljs$core$IFn$_invoke$arity$1 = js__GT_clj__1;
  js__GT_clj.cljs$core$IFn$_invoke$arity$variadic = js__GT_clj__2.cljs$core$IFn$_invoke$arity$variadic;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
  return function() {
    var G__5369__delegate = function(args) {
      var temp__4090__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(mem), args);
      if(cljs.core.truth_(temp__4090__auto__)) {
        var v = temp__4090__auto__;
        return v
      }else {
        var ret = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f, args);
        cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__5369 = function(var_args) {
      var args = null;
      if(arguments.length > 0) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5369__delegate.call(this, args)
    };
    G__5369.cljs$lang$maxFixedArity = 0;
    G__5369.cljs$lang$applyTo = function(arglist__5370) {
      var args = cljs.core.seq(arglist__5370);
      return G__5369__delegate(args)
    };
    G__5369.cljs$core$IFn$_invoke$arity$variadic = G__5369__delegate;
    return G__5369
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.cljs$core$IFn$_invoke$arity$0 ? f.cljs$core$IFn$_invoke$arity$0() : f.call(null);
      if(cljs.core.fn_QMARK_(ret)) {
        var G__5371 = ret;
        f = G__5371;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__5372__delegate = function(f, args) {
      return trampoline.cljs$core$IFn$_invoke$arity$1(function() {
        return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(f, args)
      })
    };
    var G__5372 = function(f, var_args) {
      var args = null;
      if(arguments.length > 1) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5372__delegate.call(this, f, args)
    };
    G__5372.cljs$lang$maxFixedArity = 1;
    G__5372.cljs$lang$applyTo = function(arglist__5373) {
      var f = cljs.core.first(arglist__5373);
      var args = cljs.core.rest(arglist__5373);
      return G__5372__delegate(f, args)
    };
    G__5372.cljs$core$IFn$_invoke$arity$variadic = G__5372__delegate;
    return G__5372
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$core$IFn$_invoke$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$core$IFn$_invoke$arity$1 = trampoline__1;
  trampoline.cljs$core$IFn$_invoke$arity$variadic = trampoline__2.cljs$core$IFn$_invoke$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.cljs$core$IFn$_invoke$arity$1(1)
  };
  var rand__1 = function(n) {
    return(Math.random.cljs$core$IFn$_invoke$arity$0 ? Math.random.cljs$core$IFn$_invoke$arity$0() : Math.random.call(null)) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$core$IFn$_invoke$arity$0 = rand__0;
  rand.cljs$core$IFn$_invoke$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.cljs$core$IFn$_invoke$arity$1 ? Math.floor.cljs$core$IFn$_invoke$arity$1((Math.random.cljs$core$IFn$_invoke$arity$0 ? Math.random.cljs$core$IFn$_invoke$arity$0() : Math.random.call(null)) * n) : Math.floor.call(null, (Math.random.cljs$core$IFn$_invoke$arity$0 ? Math.random.cljs$core$IFn$_invoke$arity$0() : Math.random.call(null)) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.cljs$core$IFn$_invoke$arity$2(coll, cljs.core.rand_int(cljs.core.count(coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(ret, x) {
    var k = f.cljs$core$IFn$_invoke$arity$1 ? f.cljs$core$IFn$_invoke$arity$1(x) : f.call(null, x);
    return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ret, k, cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.PersistentArrayMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:parents", cljs.core.PersistentArrayMap.EMPTY, "\ufdd0:descendants", cljs.core.PersistentArrayMap.EMPTY, "\ufdd0:ancestors", cljs.core.PersistentArrayMap.EMPTY], true)
};
cljs.core._global_hierarchy = null;
cljs.core.get_global_hierarchy = function get_global_hierarchy() {
  if(cljs.core._global_hierarchy == null) {
    cljs.core._global_hierarchy = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.make_hierarchy())
  }else {
  }
  return cljs.core._global_hierarchy
};
cljs.core.swap_global_hierarchy_BANG_ = function() {
  var swap_global_hierarchy_BANG___delegate = function(f, args) {
    return cljs.core.apply.cljs$core$IFn$_invoke$arity$4(cljs.core.swap_BANG_, cljs.core.get_global_hierarchy(), f, args)
  };
  var swap_global_hierarchy_BANG_ = function(f, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return swap_global_hierarchy_BANG___delegate.call(this, f, args)
  };
  swap_global_hierarchy_BANG_.cljs$lang$maxFixedArity = 1;
  swap_global_hierarchy_BANG_.cljs$lang$applyTo = function(arglist__5374) {
    var f = cljs.core.first(arglist__5374);
    var args = cljs.core.rest(arglist__5374);
    return swap_global_hierarchy_BANG___delegate(f, args)
  };
  swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic = swap_global_hierarchy_BANG___delegate;
  return swap_global_hierarchy_BANG_
}();
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(cljs.core.get_global_hierarchy()), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto__ = cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(child, parent);
    if(or__3943__auto__) {
      return or__3943__auto__
    }else {
      var or__3943__auto____$1 = cljs.core.contains_QMARK_((new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____$1) {
        return or__3943__auto____$1
      }else {
        var and__3941__auto__ = cljs.core.vector_QMARK_(parent);
        if(and__3941__auto__) {
          var and__3941__auto____$1 = cljs.core.vector_QMARK_(child);
          if(and__3941__auto____$1) {
            var and__3941__auto____$2 = cljs.core.count(parent) === cljs.core.count(child);
            if(and__3941__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____$2 = cljs.core.not(ret);
                  if(or__3943__auto____$2) {
                    return or__3943__auto____$2
                  }else {
                    return i === cljs.core.count(parent)
                  }
                }()) {
                  return ret
                }else {
                  var G__5375 = isa_QMARK_.cljs$core$IFn$_invoke$arity$3(h, child.cljs$core$IFn$_invoke$arity$1 ? child.cljs$core$IFn$_invoke$arity$1(i) : child.call(null, i), parent.cljs$core$IFn$_invoke$arity$1 ? parent.cljs$core$IFn$_invoke$arity$1(i) : parent.call(null, i));
                  var G__5376 = i + 1;
                  ret = G__5375;
                  i = G__5376;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____$2
            }
          }else {
            return and__3941__auto____$1
          }
        }else {
          return and__3941__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$core$IFn$_invoke$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$core$IFn$_invoke$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.core.get_global_hierarchy()), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core.get.cljs$core$IFn$_invoke$arity$2((new cljs.core.Keyword("\ufdd0:parents")).call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$core$IFn$_invoke$arity$1 = parents__1;
  parents.cljs$core$IFn$_invoke$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.core.get_global_hierarchy()), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core.get.cljs$core$IFn$_invoke$arity$2((new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$core$IFn$_invoke$arity$1 = ancestors__1;
  ancestors.cljs$core$IFn$_invoke$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cljs.core.get_global_hierarchy()), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty(cljs.core.get.cljs$core$IFn$_invoke$arity$2((new cljs.core.Keyword("\ufdd0:descendants")).call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$core$IFn$_invoke$arity$1 = descendants__1;
  descendants.cljs$core$IFn$_invoke$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace(parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.list(new cljs.core.Symbol(null, "namespace", "namespace", -388313324, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null))], 0)))].join(""));
    }
    cljs.core.swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic(derive, cljs.core.array_seq([tag, parent], 0));
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.list(new cljs.core.Symbol(null, "not=", "not=", -1637144189, null), new cljs.core.Symbol(null, "tag", "tag", -1640416941, null), new cljs.core.Symbol(null, "parent", "parent", 1659011683, null))], 0)))].join(""));
    }
    var tp = (new cljs.core.Keyword("\ufdd0:parents")).call(null, h);
    var td = (new cljs.core.Keyword("\ufdd0:descendants")).call(null, h);
    var ta = (new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h);
    var tf = function(tp, td, ta) {
      return function(m, source, sources, target, targets) {
        return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(tp, td, ta) {
          return function(ret, k) {
            return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(ret, k, cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(cljs.core.conj, cljs.core.get.cljs$core$IFn$_invoke$arity$3(targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons(target, targets.cljs$core$IFn$_invoke$arity$1 ? targets.cljs$core$IFn$_invoke$arity$1(target) : targets.call(null, target))))
          }
        }(tp, td, ta), m, cljs.core.cons(source, sources.cljs$core$IFn$_invoke$arity$1 ? sources.cljs$core$IFn$_invoke$arity$1(source) : sources.call(null, source)))
      }
    }(tp, td, ta);
    var or__3943__auto__ = cljs.core.contains_QMARK_(tp.cljs$core$IFn$_invoke$arity$1 ? tp.cljs$core$IFn$_invoke$arity$1(tag) : tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_(ta.cljs$core$IFn$_invoke$arity$1 ? ta.cljs$core$IFn$_invoke$arity$1(tag) : ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_(ta.cljs$core$IFn$_invoke$arity$1 ? ta.cljs$core$IFn$_invoke$arity$1(parent) : ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.PersistentArrayMap.fromArray(["\ufdd0:parents", cljs.core.assoc.cljs$core$IFn$_invoke$arity$3((new cljs.core.Keyword("\ufdd0:parents")).call(null, h), tag, cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0:ancestors", tf((new cljs.core.Keyword("\ufdd0:ancestors")).call(null, h), tag, td, parent, ta), "\ufdd0:descendants", tf((new cljs.core.Keyword("\ufdd0:descendants")).call(null, 
      h), parent, ta, tag, td)], true)
    }();
    if(cljs.core.truth_(or__3943__auto__)) {
      return or__3943__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$core$IFn$_invoke$arity$2 = derive__2;
  derive.cljs$core$IFn$_invoke$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_global_hierarchy_BANG_.cljs$core$IFn$_invoke$arity$variadic(underive, cljs.core.array_seq([tag, parent], 0));
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword("\ufdd0:parents")).call(null, h);
    var childsParents = cljs.core.truth_(parentMap.cljs$core$IFn$_invoke$arity$1 ? parentMap.cljs$core$IFn$_invoke$arity$1(tag) : parentMap.call(null, tag)) ? cljs.core.disj.cljs$core$IFn$_invoke$arity$2(parentMap.cljs$core$IFn$_invoke$arity$1 ? parentMap.cljs$core$IFn$_invoke$arity$1(tag) : parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty(childsParents)) ? cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(parentMap, tag, childsParents) : cljs.core.dissoc.cljs$core$IFn$_invoke$arity$2(parentMap, tag);
    var deriv_seq = cljs.core.flatten(cljs.core.map.cljs$core$IFn$_invoke$arity$2(function(parentMap, childsParents, newParents) {
      return function(p1__5377_SHARP_) {
        return cljs.core.cons(cljs.core.first(p1__5377_SHARP_), cljs.core.interpose(cljs.core.first(p1__5377_SHARP_), cljs.core.second(p1__5377_SHARP_)))
      }
    }(parentMap, childsParents, newParents), cljs.core.seq(newParents)));
    if(cljs.core.contains_QMARK_(parentMap.cljs$core$IFn$_invoke$arity$1 ? parentMap.cljs$core$IFn$_invoke$arity$1(tag) : parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(p1__5378_SHARP_, p2__5379_SHARP_) {
        return cljs.core.apply.cljs$core$IFn$_invoke$arity$3(cljs.core.derive, p1__5378_SHARP_, p2__5379_SHARP_)
      }, cljs.core.make_hierarchy(), cljs.core.partition.cljs$core$IFn$_invoke$arity$2(2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$core$IFn$_invoke$arity$2 = underive__2;
  underive.cljs$core$IFn$_invoke$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(method_cache, function(_) {
    return cljs.core.deref(method_table)
  });
  return cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(cached_hierarchy, function(_) {
    return cljs.core.deref(hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref(prefer_table).call(null, x);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = xprefs;
    if(cljs.core.truth_(and__3941__auto__)) {
      return xprefs.cljs$core$IFn$_invoke$arity$1 ? xprefs.cljs$core$IFn$_invoke$arity$1(y) : xprefs.call(null, y)
    }else {
      return and__3941__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var or__3943__auto____$1 = function() {
      var ps = cljs.core.parents.cljs$core$IFn$_invoke$arity$1(y);
      while(true) {
        if(cljs.core.count(ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_(x, cljs.core.first(ps), prefer_table))) {
          }else {
          }
          var G__5380 = cljs.core.rest(ps);
          ps = G__5380;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____$1)) {
      return or__3943__auto____$1
    }else {
      var or__3943__auto____$2 = function() {
        var ps = cljs.core.parents.cljs$core$IFn$_invoke$arity$1(x);
        while(true) {
          if(cljs.core.count(ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_(cljs.core.first(ps), y, prefer_table))) {
            }else {
            }
            var G__5381 = cljs.core.rest(ps);
            ps = G__5381;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____$2)) {
        return or__3943__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto__ = cljs.core.prefers_STAR_(x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    return cljs.core.isa_QMARK_.cljs$core$IFn$_invoke$arity$2(x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.cljs$core$IFn$_invoke$arity$3(function(be, p__5384) {
    var vec__5385 = p__5384;
    var k = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5385, 0, null);
    var _ = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__5385, 1, null);
    var e = vec__5385;
    if(cljs.core.isa_QMARK_.cljs$core$IFn$_invoke$arity$3(cljs.core.deref(hierarchy), dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3943__auto__ = be == null;
        if(or__3943__auto__) {
          return or__3943__auto__
        }else {
          return cljs.core.dominates(k, cljs.core.first(be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates(cljs.core.first(be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first(be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref(method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(cached_hierarchy), cljs.core.deref(hierarchy))) {
      cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(method_cache, cljs.core.assoc, dispatch_val, cljs.core.second(best_entry));
      return cljs.core.second(best_entry)
    }else {
      cljs.core.reset_cache(method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._reset[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._reset["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._add_method[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._add_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._remove_method[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._remove_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefer_method[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._get_method[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._get_method["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._methods[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._methods["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._prefers[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._prefers["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto__ = mf;
    if(and__3941__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2900__auto__ = mf == null ? null : mf;
    return function() {
      var or__3943__auto__ = cljs.core._dispatch[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core._dispatch["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.cljs$core$IFn$_invoke$arity$2(dispatch_fn, args);
  var target_fn = cljs.core._get_method(mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.cljs$core$IFn$_invoke$arity$2(target_fn, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorStr = "cljs.core/MultiFn";
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.method_table, function(mf__$1) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.method_cache, function(mf__$1) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.prefer_table, function(mf__$1) {
    return cljs.core.PersistentArrayMap.EMPTY
  });
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.cached_hierarchy, function(mf__$1) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache(self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$3(self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache(self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(self__.cached_hierarchy), cljs.core.deref(self__.hierarchy))) {
  }else {
    cljs.core.reset_cache(self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__4090__auto__ = cljs.core.deref(self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto__)) {
    var target_fn = temp__4090__auto__;
    return target_fn
  }else {
    var temp__4090__auto____$1 = cljs.core.find_and_cache_best_method(self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____$1)) {
      var target_fn = temp__4090__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref(self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_(dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$2(self__.prefer_table, function(old) {
    return cljs.core.assoc.cljs$core$IFn$_invoke$arity$3(old, dispatch_val_x, cljs.core.conj.cljs$core$IFn$_invoke$arity$2(cljs.core.get.cljs$core$IFn$_invoke$arity$3(old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache(self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref(self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref(self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  return cljs.core.do_dispatch(mf, self__.dispatch_fn, args)
};
cljs.core.__GT_MultiFn = function __GT_MultiFn(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  return new cljs.core.MultiFn(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__5386__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch(self, args)
  };
  var G__5386 = function(_, var_args) {
    var args = null;
    if(arguments.length > 1) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__5386__delegate.call(this, _, args)
  };
  G__5386.cljs$lang$maxFixedArity = 1;
  G__5386.cljs$lang$applyTo = function(arglist__5387) {
    var _ = cljs.core.first(arglist__5387);
    var args = cljs.core.rest(arglist__5387);
    return G__5386__delegate(_, args)
  };
  G__5386.cljs$core$IFn$_invoke$arity$variadic = G__5386__delegate;
  return G__5386
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch(self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset(multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method(multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method(multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods(multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method(multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers(multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2153775104
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorStr = "cljs.core/UUID";
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.string.hashCode(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([this$], 0)))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  return cljs.core._write(writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var and__3941__auto__ = other instanceof cljs.core.UUID;
  if(and__3941__auto__) {
    return self__.uuid === other.uuid
  }else {
    return and__3941__auto__
  }
};
cljs.core.__GT_UUID = function __GT_UUID(uuid) {
  return new cljs.core.UUID(uuid)
};
goog.provide("cljs.core.ExceptionInfo");
cljs.core.ExceptionInfo = function(message, data, cause) {
  this.message = message;
  this.data = data;
  this.cause = cause
};
cljs.core.ExceptionInfo.cljs$lang$type = true;
cljs.core.ExceptionInfo.cljs$lang$ctorStr = "cljs.core/ExceptionInfo";
cljs.core.ExceptionInfo.cljs$lang$ctorPrWriter = function(this__2844__auto__, writer__2845__auto__, opts__2846__auto__) {
  return cljs.core._write(writer__2845__auto__, "cljs.core/ExceptionInfo")
};
cljs.core.__GT_ExceptionInfo = function __GT_ExceptionInfo(message, data, cause) {
  return new cljs.core.ExceptionInfo(message, data, cause)
};
cljs.core.ExceptionInfo.prototype = new Error;
cljs.core.ExceptionInfo.prototype.constructor = cljs.core.ExceptionInfo;
cljs.core.ex_info = function() {
  var ex_info = null;
  var ex_info__2 = function(msg, map) {
    return new cljs.core.ExceptionInfo(msg, map, null)
  };
  var ex_info__3 = function(msg, map, cause) {
    return new cljs.core.ExceptionInfo(msg, map, cause)
  };
  ex_info = function(msg, map, cause) {
    switch(arguments.length) {
      case 2:
        return ex_info__2.call(this, msg, map);
      case 3:
        return ex_info__3.call(this, msg, map, cause)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ex_info.cljs$core$IFn$_invoke$arity$2 = ex_info__2;
  ex_info.cljs$core$IFn$_invoke$arity$3 = ex_info__3;
  return ex_info
}();
cljs.core.ex_data = function ex_data(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.data
  }else {
    return null
  }
};
cljs.core.ex_message = function ex_message(ex) {
  if(ex instanceof Error) {
    return ex.message
  }else {
    return null
  }
};
cljs.core.ex_cause = function ex_cause(ex) {
  if(ex instanceof cljs.core.ExceptionInfo) {
    return ex.cause
  }else {
    return null
  }
};
cljs.core.comparator = function comparator(pred) {
  return function(x, y) {
    if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$2 ? pred.cljs$core$IFn$_invoke$arity$2(x, y) : pred.call(null, x, y))) {
      return-1
    }else {
      if(cljs.core.truth_(pred.cljs$core$IFn$_invoke$arity$2 ? pred.cljs$core$IFn$_invoke$arity$2(y, x) : pred.call(null, y, x))) {
        return 1
      }else {
        if("\ufdd0:else") {
          return 0
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.special_symbol_QMARK_ = function special_symbol_QMARK_(x) {
  return cljs.core.contains_QMARK_(cljs.core.PersistentHashSet.fromArray([new cljs.core.Symbol(null, "deftype*", "deftype*", -978581244, null), null, new cljs.core.Symbol(null, "new", "new", -1640422567, null), null, new cljs.core.Symbol(null, "try*", "try*", -1636962424, null), null, new cljs.core.Symbol(null, "quote", "quote", -1532577739, null), null, new cljs.core.Symbol(null, "&", "&", -1640531489, null), null, new cljs.core.Symbol(null, "set!", "set!", -1637004872, null), null, new cljs.core.Symbol(null, 
  "recur", "recur", -1532142362, null), null, new cljs.core.Symbol(null, ".", ".", -1640531481, null), null, new cljs.core.Symbol(null, "ns", "ns", -1640528002, null), null, new cljs.core.Symbol(null, "do", "do", -1640528316, null), null, new cljs.core.Symbol(null, "fn*", "fn*", -1640430053, null), null, new cljs.core.Symbol(null, "throw", "throw", -1530191713, null), null, new cljs.core.Symbol(null, "letfn*", "letfn*", 1548249632, null), null, new cljs.core.Symbol(null, "js*", "js*", -1640426054, 
  null), null, new cljs.core.Symbol(null, "defrecord*", "defrecord*", 774272013, null), null, new cljs.core.Symbol(null, "let*", "let*", -1637213400, null), null, new cljs.core.Symbol(null, "loop*", "loop*", -1537374273, null), null, new cljs.core.Symbol(null, "if", "if", -1640528170, null), null, new cljs.core.Symbol(null, "def", "def", -1640432194, null), null], true), x)
};
goog.provide("async_tests.paint.utils");
goog.require("cljs.core");
async_tests.paint.utils.log = function log(x) {
  return console.log(cljs.core.pr_str.call(null, x))
};
async_tests.paint.utils.by_id = function by_id(id) {
  return document.getElementById(id)
};
async_tests.paint.utils.PI = Math.PI;
async_tests.paint.utils.len = function len(p__24115, p__24116) {
  var vec__24119 = p__24115;
  var px = cljs.core.nth.call(null, vec__24119, 0, null);
  var py = cljs.core.nth.call(null, vec__24119, 1, null);
  var vec__24120 = p__24116;
  var qx = cljs.core.nth.call(null, vec__24120, 0, null);
  var qy = cljs.core.nth.call(null, vec__24120, 1, null);
  var a = px - qx;
  var b = py - qy;
  return Math.sqrt.call(null, a * a + b * b)
};
goog.provide("cljs.core.async.impl.protocols");
goog.require("cljs.core");
cljs.core.async.impl.protocols.ReadPort = {};
cljs.core.async.impl.protocols.take_BANG_ = function take_BANG_(port, fn1_handler) {
  if(function() {
    var and__3941__auto__ = port;
    if(and__3941__auto__) {
      return port.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return port.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2(port, fn1_handler)
  }else {
    var x__2900__auto__ = port == null ? null : port;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.take_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.take_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("ReadPort.take!", port);
        }
      }
    }().call(null, port, fn1_handler)
  }
};
cljs.core.async.impl.protocols.WritePort = {};
cljs.core.async.impl.protocols.put_BANG_ = function put_BANG_(port, val, fn0_handler) {
  if(function() {
    var and__3941__auto__ = port;
    if(and__3941__auto__) {
      return port.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3
    }else {
      return and__3941__auto__
    }
  }()) {
    return port.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3(port, val, fn0_handler)
  }else {
    var x__2900__auto__ = port == null ? null : port;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.put_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.put_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("WritePort.put!", port);
        }
      }
    }().call(null, port, val, fn0_handler)
  }
};
cljs.core.async.impl.protocols.Channel = {};
cljs.core.async.impl.protocols.close_BANG_ = function close_BANG_(chan) {
  if(function() {
    var and__3941__auto__ = chan;
    if(and__3941__auto__) {
      return chan.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return chan.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1(chan)
  }else {
    var x__2900__auto__ = chan == null ? null : chan;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.close_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.close_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("Channel.close!", chan);
        }
      }
    }().call(null, chan)
  }
};
cljs.core.async.impl.protocols.Handler = {};
cljs.core.async.impl.protocols.active_QMARK_ = function active_QMARK_(h) {
  if(function() {
    var and__3941__auto__ = h;
    if(and__3941__auto__) {
      return h.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return h.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1(h)
  }else {
    var x__2900__auto__ = h == null ? null : h;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.active_QMARK_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.active_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("Handler.active?", h);
        }
      }
    }().call(null, h)
  }
};
cljs.core.async.impl.protocols.commit = function commit(h) {
  if(function() {
    var and__3941__auto__ = h;
    if(and__3941__auto__) {
      return h.cljs$core$async$impl$protocols$Handler$commit$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return h.cljs$core$async$impl$protocols$Handler$commit$arity$1(h)
  }else {
    var x__2900__auto__ = h == null ? null : h;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.commit[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.commit["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("Handler.commit", h);
        }
      }
    }().call(null, h)
  }
};
cljs.core.async.impl.protocols.Buffer = {};
cljs.core.async.impl.protocols.full_QMARK_ = function full_QMARK_(b) {
  if(function() {
    var and__3941__auto__ = b;
    if(and__3941__auto__) {
      return b.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return b.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1(b)
  }else {
    var x__2900__auto__ = b == null ? null : b;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.full_QMARK_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.full_QMARK_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("Buffer.full?", b);
        }
      }
    }().call(null, b)
  }
};
cljs.core.async.impl.protocols.remove_BANG_ = function remove_BANG_(b) {
  if(function() {
    var and__3941__auto__ = b;
    if(and__3941__auto__) {
      return b.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return b.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1(b)
  }else {
    var x__2900__auto__ = b == null ? null : b;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.remove_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.remove_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("Buffer.remove!", b);
        }
      }
    }().call(null, b)
  }
};
cljs.core.async.impl.protocols.add_BANG_ = function add_BANG_(b, itm) {
  if(function() {
    var and__3941__auto__ = b;
    if(and__3941__auto__) {
      return b.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2
    }else {
      return and__3941__auto__
    }
  }()) {
    return b.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2(b, itm)
  }else {
    var x__2900__auto__ = b == null ? null : b;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.protocols.add_BANG_[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.protocols.add_BANG_["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("Buffer.add!", b);
        }
      }
    }().call(null, b, itm)
  }
};
goog.provide("cljs.core.async.impl.ioc_helpers");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.impl.ioc_helpers.FN_IDX = 0;
cljs.core.async.impl.ioc_helpers.STATE_IDX = 1;
cljs.core.async.impl.ioc_helpers.VALUE_IDX = 2;
cljs.core.async.impl.ioc_helpers.BINDINGS_IDX = 3;
cljs.core.async.impl.ioc_helpers.USER_START_IDX = 4;
cljs.core.async.impl.ioc_helpers.aset_object = function aset_object(arr, idx, o) {
  return arr[idx][o]
};
cljs.core.async.impl.ioc_helpers.aget_object = function aget_object(arr, idx) {
  return arr[idx]
};
cljs.core.async.impl.ioc_helpers.finished_QMARK_ = function finished_QMARK_(state_array) {
  return state_array[cljs.core.async.impl.ioc_helpers.STATE_IDX] === "\ufdd0:finished"
};
cljs.core.async.impl.ioc_helpers.fn_handler = function fn_handler(f) {
  if(void 0 === cljs.core.async.impl.ioc_helpers.t25700) {
    goog.provide("cljs.core.async.impl.ioc_helpers.t25700");
    cljs.core.async.impl.ioc_helpers.t25700 = function(f, fn_handler, meta25701) {
      this.f = f;
      this.fn_handler = fn_handler;
      this.meta25701 = meta25701;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.impl.ioc_helpers.t25700.cljs$lang$type = true;
    cljs.core.async.impl.ioc_helpers.t25700.cljs$lang$ctorStr = "cljs.core.async.impl.ioc-helpers/t25700";
    cljs.core.async.impl.ioc_helpers.t25700.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
      return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.ioc-helpers/t25700")
    };
    cljs.core.async.impl.ioc_helpers.t25700.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.impl.ioc_helpers.t25700.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return true
    };
    cljs.core.async.impl.ioc_helpers.t25700.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      return self__.f
    };
    cljs.core.async.impl.ioc_helpers.t25700.prototype.cljs$core$IMeta$_meta$arity$1 = function(_25702) {
      var self__ = this;
      return self__.meta25701
    };
    cljs.core.async.impl.ioc_helpers.t25700.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_25702, meta25701__$1) {
      var self__ = this;
      return new cljs.core.async.impl.ioc_helpers.t25700(self__.f, self__.fn_handler, meta25701__$1)
    };
    cljs.core.async.impl.ioc_helpers.__GT_t25700 = function __GT_t25700(f__$1, fn_handler__$1, meta25701) {
      return new cljs.core.async.impl.ioc_helpers.t25700(f__$1, fn_handler__$1, meta25701)
    }
  }else {
  }
  return new cljs.core.async.impl.ioc_helpers.t25700(f, fn_handler, null)
};
cljs.core.async.impl.ioc_helpers.run_state_machine = function run_state_machine(state) {
  return cljs.core.async.impl.ioc_helpers.aget_object(state, cljs.core.async.impl.ioc_helpers.FN_IDX).call(null, state)
};
cljs.core.async.impl.ioc_helpers.take_BANG_ = function take_BANG_(state, blk, c) {
  var temp__4090__auto__ = cljs.core.async.impl.protocols.take_BANG_(c, cljs.core.async.impl.ioc_helpers.fn_handler(function(x) {
    var statearr_25705_25707 = state;
    statearr_25705_25707[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = x;
    statearr_25705_25707[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return cljs.core.async.impl.ioc_helpers.run_state_machine(state)
  }));
  if(cljs.core.truth_(temp__4090__auto__)) {
    var cb = temp__4090__auto__;
    var statearr_25706_25708 = state;
    statearr_25706_25708[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = cljs.core.deref(cb);
    statearr_25706_25708[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return"\ufdd0:recur"
  }else {
    return null
  }
};
cljs.core.async.impl.ioc_helpers.put_BANG_ = function put_BANG_(state, blk, c, val) {
  var temp__4090__auto__ = cljs.core.async.impl.protocols.put_BANG_(c, val, cljs.core.async.impl.ioc_helpers.fn_handler(function() {
    var statearr_25711_25713 = state;
    statearr_25711_25713[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = null;
    statearr_25711_25713[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return cljs.core.async.impl.ioc_helpers.run_state_machine(state)
  }));
  if(cljs.core.truth_(temp__4090__auto__)) {
    var cb = temp__4090__auto__;
    var statearr_25712_25714 = state;
    statearr_25712_25714[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = cljs.core.deref(cb);
    statearr_25712_25714[cljs.core.async.impl.ioc_helpers.STATE_IDX] = blk;
    return"\ufdd0:recur"
  }else {
    return null
  }
};
cljs.core.async.impl.ioc_helpers.ioc_alts_BANG_ = function() {
  var ioc_alts_BANG___delegate = function(state, cont_block, ports, p__25715) {
    var map__25720 = p__25715;
    var map__25720__$1 = cljs.core.seq_QMARK_(map__25720) ? cljs.core.apply.cljs$core$IFn$_invoke$arity$2(cljs.core.hash_map, map__25720) : map__25720;
    var opts = map__25720__$1;
    var statearr_25721_25724 = state;
    statearr_25721_25724[cljs.core.async.impl.ioc_helpers.STATE_IDX] = cont_block;
    var temp__4092__auto__ = cljs.core.async.do_alts(function(val) {
      var statearr_25722_25725 = state;
      statearr_25722_25725[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = val;
      return cljs.core.async.impl.ioc_helpers.run_state_machine(state)
    }, ports, opts);
    if(cljs.core.truth_(temp__4092__auto__)) {
      var cb = temp__4092__auto__;
      var statearr_25723_25726 = state;
      statearr_25723_25726[cljs.core.async.impl.ioc_helpers.VALUE_IDX] = cljs.core.deref(cb);
      return"\ufdd0:recur"
    }else {
      return null
    }
  };
  var ioc_alts_BANG_ = function(state, cont_block, ports, var_args) {
    var p__25715 = null;
    if(arguments.length > 3) {
      p__25715 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return ioc_alts_BANG___delegate.call(this, state, cont_block, ports, p__25715)
  };
  ioc_alts_BANG_.cljs$lang$maxFixedArity = 3;
  ioc_alts_BANG_.cljs$lang$applyTo = function(arglist__25727) {
    var state = cljs.core.first(arglist__25727);
    arglist__25727 = cljs.core.next(arglist__25727);
    var cont_block = cljs.core.first(arglist__25727);
    arglist__25727 = cljs.core.next(arglist__25727);
    var ports = cljs.core.first(arglist__25727);
    var p__25715 = cljs.core.rest(arglist__25727);
    return ioc_alts_BANG___delegate(state, cont_block, ports, p__25715)
  };
  ioc_alts_BANG_.cljs$core$IFn$_invoke$arity$variadic = ioc_alts_BANG___delegate;
  return ioc_alts_BANG_
}();
cljs.core.async.impl.ioc_helpers.return_chan = function return_chan(state, value) {
  var c = state[cljs.core.async.impl.ioc_helpers.USER_START_IDX];
  if(value == null) {
  }else {
    cljs.core.async.impl.protocols.put_BANG_(c, value, cljs.core.async.impl.ioc_helpers.fn_handler(function() {
      return null
    }))
  }
  cljs.core.async.impl.protocols.close_BANG_(c);
  return c
};
goog.provide("cljs.core.async.impl.dispatch");
goog.require("cljs.core");
cljs.core.async.impl.dispatch.run = function run(f) {
  return setTimeout(f, 0)
};
cljs.core.async.impl.dispatch.queue_delay = function queue_delay(f, delay) {
  return setTimeout(f, delay)
};
goog.provide("cljs.core.async.impl.buffers");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.protocols");
goog.provide("cljs.core.async.impl.buffers.FixedBuffer");
cljs.core.async.impl.buffers.FixedBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.async.impl.buffers.FixedBuffer.cljs$lang$type = true;
cljs.core.async.impl.buffers.FixedBuffer.cljs$lang$ctorStr = "cljs.core.async.impl.buffers/FixedBuffer";
cljs.core.async.impl.buffers.FixedBuffer.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.buffers/FixedBuffer")
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.length
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$ = true;
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.buf.length, self__.n)
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.pop()
};
cljs.core.async.impl.buffers.FixedBuffer.prototype.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2 = function(this$, itm) {
  var self__ = this;
  if(cljs.core.not(this$.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1(this$))) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Can't add to a full buffer"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.list(new cljs.core.Symbol(null, "not", "not", -1640422260, null), cljs.core.list(new cljs.core.Symbol("impl", "full?", "impl/full?", -1337857039, null), new cljs.core.Symbol(null, "this", "this", -1636972457, null)))], 0)))].join(""));
  }
  return self__.buf.unshift(itm)
};
cljs.core.async.impl.buffers.__GT_FixedBuffer = function __GT_FixedBuffer(buf, n) {
  return new cljs.core.async.impl.buffers.FixedBuffer(buf, n)
};
cljs.core.async.impl.buffers.fixed_buffer = function fixed_buffer(n) {
  return new cljs.core.async.impl.buffers.FixedBuffer(new Array(0), n)
};
goog.provide("cljs.core.async.impl.buffers.DroppingBuffer");
cljs.core.async.impl.buffers.DroppingBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.async.impl.buffers.DroppingBuffer.cljs$lang$type = true;
cljs.core.async.impl.buffers.DroppingBuffer.cljs$lang$ctorStr = "cljs.core.async.impl.buffers/DroppingBuffer";
cljs.core.async.impl.buffers.DroppingBuffer.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.buffers/DroppingBuffer")
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.length
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$ = true;
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1 = function(this$) {
  var self__ = this;
  return false
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.pop()
};
cljs.core.async.impl.buffers.DroppingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2 = function(this$, itm) {
  var self__ = this;
  if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.buf.length, self__.n)) {
    return null
  }else {
    return self__.buf.unshift(itm)
  }
};
cljs.core.async.impl.buffers.__GT_DroppingBuffer = function __GT_DroppingBuffer(buf, n) {
  return new cljs.core.async.impl.buffers.DroppingBuffer(buf, n)
};
cljs.core.async.impl.buffers.dropping_buffer = function dropping_buffer(n) {
  return new cljs.core.async.impl.buffers.DroppingBuffer(new Array(0), n)
};
goog.provide("cljs.core.async.impl.buffers.SlidingBuffer");
cljs.core.async.impl.buffers.SlidingBuffer = function(buf, n) {
  this.buf = buf;
  this.n = n;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.async.impl.buffers.SlidingBuffer.cljs$lang$type = true;
cljs.core.async.impl.buffers.SlidingBuffer.cljs$lang$ctorStr = "cljs.core.async.impl.buffers/SlidingBuffer";
cljs.core.async.impl.buffers.SlidingBuffer.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.buffers/SlidingBuffer")
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.length
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$ = true;
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$full_QMARK_$arity$1 = function(this$) {
  var self__ = this;
  return false
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1 = function(this$) {
  var self__ = this;
  return self__.buf.pop()
};
cljs.core.async.impl.buffers.SlidingBuffer.prototype.cljs$core$async$impl$protocols$Buffer$add_BANG_$arity$2 = function(this$, itm) {
  var self__ = this;
  if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(self__.buf.length, self__.n)) {
    this$.cljs$core$async$impl$protocols$Buffer$remove_BANG_$arity$1(this$)
  }else {
  }
  return self__.buf.unshift(itm)
};
cljs.core.async.impl.buffers.__GT_SlidingBuffer = function __GT_SlidingBuffer(buf, n) {
  return new cljs.core.async.impl.buffers.SlidingBuffer(buf, n)
};
cljs.core.async.impl.buffers.sliding_buffer = function sliding_buffer(n) {
  return new cljs.core.async.impl.buffers.SlidingBuffer(new Array(0), n)
};
goog.provide("cljs.core.async.impl.channels");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.dispatch");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.impl.channels.box = function box(val) {
  if(void 0 === cljs.core.async.impl.channels.t25675) {
    goog.provide("cljs.core.async.impl.channels.t25675");
    cljs.core.async.impl.channels.t25675 = function(val, box, meta25676) {
      this.val = val;
      this.box = box;
      this.meta25676 = meta25676;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 425984
    };
    cljs.core.async.impl.channels.t25675.cljs$lang$type = true;
    cljs.core.async.impl.channels.t25675.cljs$lang$ctorStr = "cljs.core.async.impl.channels/t25675";
    cljs.core.async.impl.channels.t25675.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
      return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.channels/t25675")
    };
    cljs.core.async.impl.channels.t25675.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
      var self__ = this;
      return self__.val
    };
    cljs.core.async.impl.channels.t25675.prototype.cljs$core$IMeta$_meta$arity$1 = function(_25677) {
      var self__ = this;
      return self__.meta25676
    };
    cljs.core.async.impl.channels.t25675.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_25677, meta25676__$1) {
      var self__ = this;
      return new cljs.core.async.impl.channels.t25675(self__.val, self__.box, meta25676__$1)
    };
    cljs.core.async.impl.channels.__GT_t25675 = function __GT_t25675(val__$1, box__$1, meta25676) {
      return new cljs.core.async.impl.channels.t25675(val__$1, box__$1, meta25676)
    }
  }else {
  }
  return new cljs.core.async.impl.channels.t25675(val, box, null)
};
cljs.core.async.impl.channels.MMC = {};
cljs.core.async.impl.channels.cleanup = function cleanup(_) {
  if(function() {
    var and__3941__auto__ = _;
    if(and__3941__auto__) {
      return _.cljs$core$async$impl$channels$MMC$cleanup$arity$1
    }else {
      return and__3941__auto__
    }
  }()) {
    return _.cljs$core$async$impl$channels$MMC$cleanup$arity$1(_)
  }else {
    var x__2900__auto__ = _ == null ? null : _;
    return function() {
      var or__3943__auto__ = cljs.core.async.impl.channels.cleanup[goog.typeOf(x__2900__auto__)];
      if(or__3943__auto__) {
        return or__3943__auto__
      }else {
        var or__3943__auto____$1 = cljs.core.async.impl.channels.cleanup["_"];
        if(or__3943__auto____$1) {
          return or__3943__auto____$1
        }else {
          throw cljs.core.missing_protocol("MMC.cleanup", _);
        }
      }
    }().call(null, _)
  }
};
goog.provide("cljs.core.async.impl.channels.ManyToManyChannel");
cljs.core.async.impl.channels.ManyToManyChannel = function(takes, puts, buf, closed) {
  this.takes = takes;
  this.puts = puts;
  this.buf = buf;
  this.closed = closed
};
cljs.core.async.impl.channels.ManyToManyChannel.cljs$lang$type = true;
cljs.core.async.impl.channels.ManyToManyChannel.cljs$lang$ctorStr = "cljs.core.async.impl.channels/ManyToManyChannel";
cljs.core.async.impl.channels.ManyToManyChannel.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.channels/ManyToManyChannel")
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$Channel$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$Channel$close_BANG_$arity$1 = function(this$) {
  var self__ = this;
  this$.cljs$core$async$impl$channels$MMC$cleanup$arity$1(this$);
  if(cljs.core.truth_(cljs.core.deref(self__.closed))) {
    return null
  }else {
    cljs.core.reset_BANG_(self__.closed, true);
    var n__3078__auto___25682 = self__.takes.length;
    var idx_25683 = 0;
    while(true) {
      if(idx_25683 < n__3078__auto___25682) {
        var taker_25684 = self__.takes[idx_25683];
        var take_cb_25685 = function() {
          var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(taker_25684);
          if(cljs.core.truth_(and__3941__auto__)) {
            return cljs.core.async.impl.protocols.commit(taker_25684)
          }else {
            return and__3941__auto__
          }
        }();
        if(cljs.core.truth_(take_cb_25685)) {
          cljs.core.async.impl.dispatch.run(function(idx_25683, taker_25684, take_cb_25685) {
            return function() {
              return take_cb_25685.cljs$core$IFn$_invoke$arity$1 ? take_cb_25685.cljs$core$IFn$_invoke$arity$1(null) : take_cb_25685.call(null, null)
            }
          }(idx_25683, taker_25684, take_cb_25685))
        }else {
        }
        var G__25686 = idx_25683 + 1;
        idx_25683 = G__25686;
        continue
      }else {
      }
      break
    }
    return null
  }
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$ReadPort$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$ReadPort$take_BANG_$arity$2 = function(this$, handler) {
  var self__ = this;
  this$.cljs$core$async$impl$channels$MMC$cleanup$arity$1(this$);
  if(cljs.core.truth_(function() {
    var and__3941__auto__ = self__.buf;
    if(cljs.core.truth_(and__3941__auto__)) {
      return cljs.core.count(self__.buf) > 0
    }else {
      return and__3941__auto__
    }
  }())) {
    var temp__4090__auto__ = function() {
      var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(handler);
      if(cljs.core.truth_(and__3941__auto__)) {
        return cljs.core.async.impl.protocols.commit(handler)
      }else {
        return and__3941__auto__
      }
    }();
    if(cljs.core.truth_(temp__4090__auto__)) {
      var take_cb = temp__4090__auto__;
      return cljs.core.async.impl.channels.box(cljs.core.async.impl.protocols.remove_BANG_(self__.buf))
    }else {
      return null
    }
  }else {
    var vec__25678 = function() {
      var put_idx = 0;
      while(true) {
        if(put_idx < self__.puts.length) {
          var vec__25679 = self__.puts[put_idx];
          var putter = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25679, 0, null);
          var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25679, 1, null);
          var temp__4090__auto__ = cljs.core.truth_(function() {
            var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(handler);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.async.impl.protocols.active_QMARK_(putter)
            }else {
              return and__3941__auto__
            }
          }()) ? cljs.core.PersistentVector.fromArray([cljs.core.async.impl.protocols.commit(handler), cljs.core.async.impl.protocols.commit(putter), val], true) : null;
          if(cljs.core.truth_(temp__4090__auto__)) {
            var ret = temp__4090__auto__;
            self__.puts.splice(put_idx, 1);
            return ret
          }else {
            var G__25687 = put_idx + 1;
            put_idx = G__25687;
            continue
          }
        }else {
          return null
        }
        break
      }
    }();
    var take_cb = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25678, 0, null);
    var put_cb = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25678, 1, null);
    var val = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25678, 2, null);
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = put_cb;
      if(cljs.core.truth_(and__3941__auto__)) {
        return take_cb
      }else {
        return and__3941__auto__
      }
    }())) {
      cljs.core.async.impl.dispatch.run(put_cb);
      return cljs.core.async.impl.channels.box(val)
    }else {
      if(cljs.core.truth_(cljs.core.deref(self__.closed))) {
        var temp__4090__auto__ = function() {
          var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(handler);
          if(cljs.core.truth_(and__3941__auto__)) {
            return cljs.core.async.impl.protocols.commit(handler)
          }else {
            return and__3941__auto__
          }
        }();
        if(cljs.core.truth_(temp__4090__auto__)) {
          var take_cb__$1 = temp__4090__auto__;
          return cljs.core.async.impl.channels.box(null)
        }else {
          return null
        }
      }else {
        self__.takes.unshift(handler);
        return null
      }
    }
  }
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$WritePort$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$protocols$WritePort$put_BANG_$arity$3 = function(this$, val, handler) {
  var self__ = this;
  if(!(val == null)) {
  }else {
    throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Can't put nil in on a channel"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([cljs.core.list(new cljs.core.Symbol(null, "not", "not", -1640422260, null), cljs.core.list(new cljs.core.Symbol(null, "nil?", "nil?", -1637150201, null), new cljs.core.Symbol(null, "val", "val", -1640415014, null)))], 0)))].join(""));
  }
  this$.cljs$core$async$impl$channels$MMC$cleanup$arity$1(this$);
  if(cljs.core.truth_(cljs.core.deref(self__.closed))) {
    return cljs.core.async.impl.channels.box(null)
  }else {
    var vec__25680 = function() {
      var taker_idx = 0;
      while(true) {
        if(taker_idx < self__.takes.length) {
          var taker = self__.takes[taker_idx];
          if(cljs.core.truth_(function() {
            var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(taker);
            if(cljs.core.truth_(and__3941__auto__)) {
              return cljs.core.async.impl.protocols.active_QMARK_(handler)
            }else {
              return and__3941__auto__
            }
          }())) {
            self__.takes.splice(taker_idx, 1);
            return cljs.core.PersistentVector.fromArray([cljs.core.async.impl.protocols.commit(handler), cljs.core.async.impl.protocols.commit(taker)], true)
          }else {
            var G__25688 = taker_idx + 1;
            taker_idx = G__25688;
            continue
          }
        }else {
          return null
        }
        break
      }
    }();
    var put_cb = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25680, 0, null);
    var take_cb = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25680, 1, null);
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = put_cb;
      if(cljs.core.truth_(and__3941__auto__)) {
        return take_cb
      }else {
        return and__3941__auto__
      }
    }())) {
      cljs.core.async.impl.dispatch.run(function() {
        return take_cb.cljs$core$IFn$_invoke$arity$1 ? take_cb.cljs$core$IFn$_invoke$arity$1(val) : take_cb.call(null, val)
      });
      return cljs.core.async.impl.channels.box(null)
    }else {
      if(cljs.core.truth_(function() {
        var and__3941__auto__ = self__.buf;
        if(cljs.core.truth_(and__3941__auto__)) {
          return cljs.core.not(cljs.core.async.impl.protocols.full_QMARK_(self__.buf))
        }else {
          return and__3941__auto__
        }
      }())) {
        var put_cb__$1 = function() {
          var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(handler);
          if(cljs.core.truth_(and__3941__auto__)) {
            return cljs.core.async.impl.protocols.commit(handler)
          }else {
            return and__3941__auto__
          }
        }();
        if(cljs.core.truth_(put_cb__$1)) {
          cljs.core.async.impl.protocols.add_BANG_(self__.buf, val);
          return cljs.core.async.impl.channels.box(null)
        }else {
          return null
        }
      }else {
        self__.puts.unshift(cljs.core.PersistentVector.fromArray([handler, val], true));
        return null
      }
    }
  }
};
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$channels$MMC$ = true;
cljs.core.async.impl.channels.ManyToManyChannel.prototype.cljs$core$async$impl$channels$MMC$cleanup$arity$1 = function(_) {
  var self__ = this;
  var idx_25689 = 0;
  while(true) {
    if(idx_25689 < self__.puts.length) {
      var vec__25681_25690 = self__.puts[idx_25689];
      var itm_25691 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25681_25690, 0, null);
      var val_25692 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__25681_25690, 1, null);
      if(cljs.core.truth_(cljs.core.async.impl.protocols.active_QMARK_(itm_25691))) {
        var G__25693 = idx_25689 + 1;
        idx_25689 = G__25693;
        continue
      }else {
        self__.puts.splice(idx_25689, 1);
        var G__25694 = idx_25689;
        idx_25689 = G__25694;
        continue
      }
    }else {
    }
    break
  }
  var idx = 0;
  while(true) {
    if(idx < self__.takes.length) {
      var itm = self__.takes[idx];
      if(cljs.core.truth_(cljs.core.async.impl.protocols.active_QMARK_(itm))) {
        var G__25695 = idx + 1;
        idx = G__25695;
        continue
      }else {
        self__.takes.splice(idx, 1);
        var G__25696 = idx;
        idx = G__25696;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.async.impl.channels.__GT_ManyToManyChannel = function __GT_ManyToManyChannel(takes, puts, buf, closed) {
  return new cljs.core.async.impl.channels.ManyToManyChannel(takes, puts, buf, closed)
};
cljs.core.async.impl.channels.chan = function chan(buf) {
  return new cljs.core.async.impl.channels.ManyToManyChannel(new Array(0), new Array(0), buf, cljs.core.atom.cljs$core$IFn$_invoke$arity$1(null))
};
goog.provide("cljs.core.async.impl.timers");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.dispatch");
goog.require("cljs.core.async.impl.channels");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.impl.timers.MAX_LEVEL = 15;
cljs.core.async.impl.timers.P = 1 / 2;
cljs.core.async.impl.timers.random_level = function() {
  var random_level = null;
  var random_level__0 = function() {
    return random_level.cljs$core$IFn$_invoke$arity$1(0)
  };
  var random_level__1 = function(level) {
    while(true) {
      if(function() {
        var and__3941__auto__ = Math.random() < cljs.core.async.impl.timers.P;
        if(and__3941__auto__) {
          return level < cljs.core.async.impl.timers.MAX_LEVEL
        }else {
          return and__3941__auto__
        }
      }()) {
        var G__25648 = level + 1;
        level = G__25648;
        continue
      }else {
        return level
      }
      break
    }
  };
  random_level = function(level) {
    switch(arguments.length) {
      case 0:
        return random_level__0.call(this);
      case 1:
        return random_level__1.call(this, level)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  random_level.cljs$core$IFn$_invoke$arity$0 = random_level__0;
  random_level.cljs$core$IFn$_invoke$arity$1 = random_level__1;
  return random_level
}();
goog.provide("cljs.core.async.impl.timers.SkipListNode");
cljs.core.async.impl.timers.SkipListNode = function(key, val, forward) {
  this.key = key;
  this.val = val;
  this.forward = forward;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155872256
};
cljs.core.async.impl.timers.SkipListNode.cljs$lang$type = true;
cljs.core.async.impl.timers.SkipListNode.cljs$lang$ctorStr = "cljs.core.async.impl.timers/SkipListNode";
cljs.core.async.impl.timers.SkipListNode.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.timers/SkipListNode")
};
cljs.core.async.impl.timers.SkipListNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var self__ = this;
  return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.async.impl.timers.SkipListNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.list.cljs$core$IFn$_invoke$arity$variadic(cljs.core.array_seq([self__.key, self__.val], 0))
};
cljs.core.async.impl.timers.__GT_SkipListNode = function __GT_SkipListNode(key, val, forward) {
  return new cljs.core.async.impl.timers.SkipListNode(key, val, forward)
};
cljs.core.async.impl.timers.skip_list_node = function() {
  var skip_list_node = null;
  var skip_list_node__1 = function(level) {
    return skip_list_node.cljs$core$IFn$_invoke$arity$3(null, null, level)
  };
  var skip_list_node__3 = function(k, v, level) {
    var arr = new Array(level + 1);
    var i_25649 = 0;
    while(true) {
      if(i_25649 < arr.length) {
        arr[i_25649] = null;
        var G__25650 = i_25649 + 1;
        i_25649 = G__25650;
        continue
      }else {
      }
      break
    }
    return new cljs.core.async.impl.timers.SkipListNode(k, v, arr)
  };
  skip_list_node = function(k, v, level) {
    switch(arguments.length) {
      case 1:
        return skip_list_node__1.call(this, k);
      case 3:
        return skip_list_node__3.call(this, k, v, level)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  skip_list_node.cljs$core$IFn$_invoke$arity$1 = skip_list_node__1;
  skip_list_node.cljs$core$IFn$_invoke$arity$3 = skip_list_node__3;
  return skip_list_node
}();
cljs.core.async.impl.timers.least_greater_node = function() {
  var least_greater_node = null;
  var least_greater_node__3 = function(x, k, level) {
    return least_greater_node.cljs$core$IFn$_invoke$arity$4(x, k, level, null)
  };
  var least_greater_node__4 = function(x, k, level, update) {
    while(true) {
      if(!(level < 0)) {
        var x__$1 = function() {
          var x__$1 = x;
          while(true) {
            var temp__4090__auto__ = x__$1.forward[level];
            if(cljs.core.truth_(temp__4090__auto__)) {
              var x_SINGLEQUOTE_ = temp__4090__auto__;
              if(x_SINGLEQUOTE_.key < k) {
                var G__25651 = x_SINGLEQUOTE_;
                x__$1 = G__25651;
                continue
              }else {
                return x__$1
              }
            }else {
              return x__$1
            }
            break
          }
        }();
        if(update == null) {
        }else {
          update[level] = x__$1
        }
        var G__25652 = x__$1;
        var G__25653 = k;
        var G__25654 = level - 1;
        var G__25655 = update;
        x = G__25652;
        k = G__25653;
        level = G__25654;
        update = G__25655;
        continue
      }else {
        return x
      }
      break
    }
  };
  least_greater_node = function(x, k, level, update) {
    switch(arguments.length) {
      case 3:
        return least_greater_node__3.call(this, x, k, level);
      case 4:
        return least_greater_node__4.call(this, x, k, level, update)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  least_greater_node.cljs$core$IFn$_invoke$arity$3 = least_greater_node__3;
  least_greater_node.cljs$core$IFn$_invoke$arity$4 = least_greater_node__4;
  return least_greater_node
}();
goog.provide("cljs.core.async.impl.timers.SkipList");
cljs.core.async.impl.timers.SkipList = function(header, level) {
  this.header = header;
  this.level = level;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155872256
};
cljs.core.async.impl.timers.SkipList.cljs$lang$type = true;
cljs.core.async.impl.timers.SkipList.cljs$lang$ctorStr = "cljs.core.async.impl.timers/SkipList";
cljs.core.async.impl.timers.SkipList.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
  return cljs.core._write(writer__2842__auto__, "cljs.core.async.impl.timers/SkipList")
};
cljs.core.async.impl.timers.SkipList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var self__ = this;
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer(writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer(writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.async.impl.timers.SkipList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var iter = function iter(node) {
    return new cljs.core.LazySeq(null, false, function() {
      if(node == null) {
        return null
      }else {
        return cljs.core.cons(cljs.core.PersistentVector.fromArray([node.key, node.val], true), iter(node.forward[0]))
      }
    }, null)
  };
  return iter.cljs$core$IFn$_invoke$arity$1 ? iter.cljs$core$IFn$_invoke$arity$1(self__.header.forward[0]) : iter.call(null, self__.header.forward[0])
};
cljs.core.async.impl.timers.SkipList.prototype.put = function(k, v) {
  var self__ = this;
  var coll = this;
  var update = new Array(cljs.core.async.impl.timers.MAX_LEVEL);
  var x = cljs.core.async.impl.timers.least_greater_node.cljs$core$IFn$_invoke$arity$4(self__.header, k, self__.level, update);
  var x__$1 = x.forward[0];
  if(function() {
    var and__3941__auto__ = !(x__$1 == null);
    if(and__3941__auto__) {
      return x__$1.key === k
    }else {
      return and__3941__auto__
    }
  }()) {
    return x__$1.val = v
  }else {
    var new_level = cljs.core.async.impl.timers.random_level.cljs$core$IFn$_invoke$arity$0();
    if(new_level > self__.level) {
      var i_25656 = self__.level + 1;
      while(true) {
        if(i_25656 <= new_level + 1) {
          update[i_25656] = self__.header;
          var G__25657 = i_25656 + 1;
          i_25656 = G__25657;
          continue
        }else {
        }
        break
      }
      self__.level = new_level
    }else {
    }
    var x__$2 = cljs.core.async.impl.timers.skip_list_node.cljs$core$IFn$_invoke$arity$3(k, v, new Array(new_level));
    var i = 0;
    while(true) {
      if(i <= self__.level) {
        var links = update[i].forward;
        x__$2.forward[i] = links[i];
        return links[i] = x__$2
      }else {
        return null
      }
      break
    }
  }
};
cljs.core.async.impl.timers.SkipList.prototype.remove = function(k) {
  var self__ = this;
  var coll = this;
  var update = new Array(cljs.core.async.impl.timers.MAX_LEVEL);
  var x = cljs.core.async.impl.timers.least_greater_node.cljs$core$IFn$_invoke$arity$4(self__.header, k, self__.level, update);
  var x__$1 = x.forward[0];
  if(function() {
    var and__3941__auto__ = !(x__$1 == null);
    if(and__3941__auto__) {
      return x__$1.key === k
    }else {
      return and__3941__auto__
    }
  }()) {
    var i_25658 = 0;
    while(true) {
      if(i_25658 <= self__.level) {
        var links_25659 = update[i_25658].forward;
        if(links_25659[i_25658] === x__$1) {
          links_25659[i_25658] = x__$1.forward[i_25658];
          var G__25660 = i_25658 + 1;
          i_25658 = G__25660;
          continue
        }else {
          var G__25661 = i_25658 + 1;
          i_25658 = G__25661;
          continue
        }
      }else {
      }
      break
    }
    while(true) {
      if(function() {
        var and__3941__auto__ = self__.level > 0;
        if(and__3941__auto__) {
          return self__.header.forward[self__.level] == null
        }else {
          return and__3941__auto__
        }
      }()) {
        self__.level = self__.level - 1;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.async.impl.timers.SkipList.prototype.ceilingEntry = function(k) {
  var self__ = this;
  var coll = this;
  var x = self__.header;
  var level__$1 = self__.level;
  while(true) {
    if(!(level__$1 < 0)) {
      var nx = function() {
        var x__$1 = x;
        while(true) {
          var x_SINGLEQUOTE_ = x__$1.forward[level__$1];
          if(x_SINGLEQUOTE_ == null) {
            return null
          }else {
            if(x_SINGLEQUOTE_.key >= k) {
              return x_SINGLEQUOTE_
            }else {
              var G__25662 = x_SINGLEQUOTE_;
              x__$1 = G__25662;
              continue
            }
          }
          break
        }
      }();
      if(!(nx == null)) {
        var G__25663 = nx;
        var G__25664 = level__$1 - 1;
        x = G__25663;
        level__$1 = G__25664;
        continue
      }else {
        var G__25665 = x;
        var G__25666 = level__$1 - 1;
        x = G__25665;
        level__$1 = G__25666;
        continue
      }
    }else {
      if(x === self__.header) {
        return null
      }else {
        return x
      }
    }
    break
  }
};
cljs.core.async.impl.timers.SkipList.prototype.floorEntry = function(k) {
  var self__ = this;
  var coll = this;
  var x = self__.header;
  var level__$1 = self__.level;
  while(true) {
    if(!(level__$1 < 0)) {
      var nx = function() {
        var x__$1 = x;
        while(true) {
          var x_SINGLEQUOTE_ = x__$1.forward[level__$1];
          if(!(x_SINGLEQUOTE_ == null)) {
            if(x_SINGLEQUOTE_.key > k) {
              return x__$1
            }else {
              var G__25667 = x_SINGLEQUOTE_;
              x__$1 = G__25667;
              continue
            }
          }else {
            if(level__$1 === 0) {
              return x__$1
            }else {
              return null
            }
          }
          break
        }
      }();
      if(cljs.core.truth_(nx)) {
        var G__25668 = nx;
        var G__25669 = level__$1 - 1;
        x = G__25668;
        level__$1 = G__25669;
        continue
      }else {
        var G__25670 = x;
        var G__25671 = level__$1 - 1;
        x = G__25670;
        level__$1 = G__25671;
        continue
      }
    }else {
      if(x === self__.header) {
        return null
      }else {
        return x
      }
    }
    break
  }
};
cljs.core.async.impl.timers.__GT_SkipList = function __GT_SkipList(header, level) {
  return new cljs.core.async.impl.timers.SkipList(header, level)
};
cljs.core.async.impl.timers.skip_list = function skip_list() {
  return new cljs.core.async.impl.timers.SkipList(cljs.core.async.impl.timers.skip_list_node.cljs$core$IFn$_invoke$arity$1(0), 0)
};
cljs.core.async.impl.timers.timeouts_map = cljs.core.async.impl.timers.skip_list();
cljs.core.async.impl.timers.TIMEOUT_RESOLUTION_MS = 10;
cljs.core.async.impl.timers.timeout = function timeout(msecs) {
  var timeout__$1 = (new Date).valueOf() + msecs;
  var me = cljs.core.async.impl.timers.timeouts_map.ceilingEntry(timeout__$1);
  var or__3943__auto__ = cljs.core.truth_(function() {
    var and__3941__auto__ = me;
    if(cljs.core.truth_(and__3941__auto__)) {
      return me.key < timeout__$1 + cljs.core.async.impl.timers.TIMEOUT_RESOLUTION_MS
    }else {
      return and__3941__auto__
    }
  }()) ? me.val : null;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    var timeout_channel = cljs.core.async.impl.channels.chan(null);
    cljs.core.async.impl.timers.timeouts_map.put(timeout__$1, timeout_channel);
    cljs.core.async.impl.dispatch.queue_delay(function() {
      cljs.core.async.impl.timers.timeouts_map.remove(timeout__$1);
      return cljs.core.async.impl.protocols.close_BANG_(timeout_channel)
    }, msecs);
    return timeout_channel
  }
};
goog.provide("cljs.core.async");
goog.require("cljs.core");
goog.require("cljs.core.async.impl.ioc_helpers");
goog.require("cljs.core.async.impl.timers");
goog.require("cljs.core.async.impl.buffers");
goog.require("cljs.core.async.impl.channels");
goog.require("cljs.core.async.impl.protocols");
cljs.core.async.fn_handler = function fn_handler(f) {
  if(void 0 === cljs.core.async.t25626) {
    goog.provide("cljs.core.async.t25626");
    cljs.core.async.t25626 = function(f, fn_handler, meta25627) {
      this.f = f;
      this.fn_handler = fn_handler;
      this.meta25627 = meta25627;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.t25626.cljs$lang$type = true;
    cljs.core.async.t25626.cljs$lang$ctorStr = "cljs.core.async/t25626";
    cljs.core.async.t25626.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
      return cljs.core._write(writer__2842__auto__, "cljs.core.async/t25626")
    };
    cljs.core.async.t25626.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.t25626.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return true
    };
    cljs.core.async.t25626.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      return self__.f
    };
    cljs.core.async.t25626.prototype.cljs$core$IMeta$_meta$arity$1 = function(_25628) {
      var self__ = this;
      return self__.meta25627
    };
    cljs.core.async.t25626.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_25628, meta25627__$1) {
      var self__ = this;
      return new cljs.core.async.t25626(self__.f, self__.fn_handler, meta25627__$1)
    };
    cljs.core.async.__GT_t25626 = function __GT_t25626(f__$1, fn_handler__$1, meta25627) {
      return new cljs.core.async.t25626(f__$1, fn_handler__$1, meta25627)
    }
  }else {
  }
  return new cljs.core.async.t25626(f, fn_handler, null)
};
cljs.core.async.buffer = function buffer(n) {
  return cljs.core.async.impl.buffers.fixed_buffer(n)
};
cljs.core.async.dropping_buffer = function dropping_buffer(n) {
  return cljs.core.async.impl.buffers.dropping_buffer(n)
};
cljs.core.async.sliding_buffer = function sliding_buffer(n) {
  return cljs.core.async.impl.buffers.sliding_buffer(n)
};
cljs.core.async.chan = function() {
  var chan = null;
  var chan__0 = function() {
    return chan.cljs$core$IFn$_invoke$arity$1(null)
  };
  var chan__1 = function(buf_or_n) {
    return cljs.core.async.impl.channels.chan(typeof buf_or_n === "number" ? cljs.core.async.buffer(buf_or_n) : buf_or_n)
  };
  chan = function(buf_or_n) {
    switch(arguments.length) {
      case 0:
        return chan__0.call(this);
      case 1:
        return chan__1.call(this, buf_or_n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chan.cljs$core$IFn$_invoke$arity$0 = chan__0;
  chan.cljs$core$IFn$_invoke$arity$1 = chan__1;
  return chan
}();
cljs.core.async.timeout = function timeout(msecs) {
  return cljs.core.async.impl.timers.timeout(msecs)
};
cljs.core.async.take_BANG_ = function() {
  var take_BANG_ = null;
  var take_BANG___2 = function(port, fn1) {
    return take_BANG_.cljs$core$IFn$_invoke$arity$3(port, fn1, true)
  };
  var take_BANG___3 = function(port, fn1, on_caller_QMARK_) {
    var ret = cljs.core.async.impl.protocols.take_BANG_(port, cljs.core.async.fn_handler(fn1));
    if(cljs.core.truth_(ret)) {
      var val_25629 = cljs.core.deref(ret);
      if(cljs.core.truth_(on_caller_QMARK_)) {
        fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_25629) : fn1.call(null, val_25629)
      }else {
        dispatch.run.cljs$core$IFn$_invoke$arity$1 ? dispatch.run.cljs$core$IFn$_invoke$arity$1(function() {
          return fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_25629) : fn1.call(null, val_25629)
        }) : dispatch.run.call(null, function() {
          return fn1.cljs$core$IFn$_invoke$arity$1 ? fn1.cljs$core$IFn$_invoke$arity$1(val_25629) : fn1.call(null, val_25629)
        })
      }
    }else {
    }
    return null
  };
  take_BANG_ = function(port, fn1, on_caller_QMARK_) {
    switch(arguments.length) {
      case 2:
        return take_BANG___2.call(this, port, fn1);
      case 3:
        return take_BANG___3.call(this, port, fn1, on_caller_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  take_BANG_.cljs$core$IFn$_invoke$arity$2 = take_BANG___2;
  take_BANG_.cljs$core$IFn$_invoke$arity$3 = take_BANG___3;
  return take_BANG_
}();
cljs.core.async.nop = function nop() {
  return null
};
cljs.core.async.put_BANG_ = function() {
  var put_BANG_ = null;
  var put_BANG___2 = function(port, val) {
    return put_BANG_.cljs$core$IFn$_invoke$arity$3(port, val, cljs.core.async.nop)
  };
  var put_BANG___3 = function(port, val, fn0) {
    return put_BANG_.cljs$core$IFn$_invoke$arity$4(port, val, fn0, true)
  };
  var put_BANG___4 = function(port, val, fn0, on_caller_QMARK_) {
    var ret = cljs.core.async.impl.protocols.put_BANG_(port, val, cljs.core.async.fn_handler(fn0));
    if(cljs.core.truth_(function() {
      var and__3941__auto__ = ret;
      if(cljs.core.truth_(and__3941__auto__)) {
        return cljs.core.not_EQ_.cljs$core$IFn$_invoke$arity$2(fn0, cljs.core.async.nop)
      }else {
        return and__3941__auto__
      }
    }())) {
      if(cljs.core.truth_(on_caller_QMARK_)) {
        fn0.cljs$core$IFn$_invoke$arity$0 ? fn0.cljs$core$IFn$_invoke$arity$0() : fn0.call(null)
      }else {
        dispatch.run.cljs$core$IFn$_invoke$arity$1 ? dispatch.run.cljs$core$IFn$_invoke$arity$1(fn0) : dispatch.run.call(null, fn0)
      }
    }else {
    }
    return null
  };
  put_BANG_ = function(port, val, fn0, on_caller_QMARK_) {
    switch(arguments.length) {
      case 2:
        return put_BANG___2.call(this, port, val);
      case 3:
        return put_BANG___3.call(this, port, val, fn0);
      case 4:
        return put_BANG___4.call(this, port, val, fn0, on_caller_QMARK_)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  put_BANG_.cljs$core$IFn$_invoke$arity$2 = put_BANG___2;
  put_BANG_.cljs$core$IFn$_invoke$arity$3 = put_BANG___3;
  put_BANG_.cljs$core$IFn$_invoke$arity$4 = put_BANG___4;
  return put_BANG_
}();
cljs.core.async.close_BANG_ = function close_BANG_(port) {
  return cljs.core.async.impl.protocols.close_BANG_(port)
};
cljs.core.async.random_array = function random_array(n) {
  var a = new Array(n);
  var n__3078__auto___25630 = n;
  var x_25631 = 0;
  while(true) {
    if(x_25631 < n__3078__auto___25630) {
      a[x_25631] = 0;
      var G__25632 = x_25631 + 1;
      x_25631 = G__25632;
      continue
    }else {
    }
    break
  }
  var i = 1;
  while(true) {
    if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(i, n)) {
      return a
    }else {
      var j = cljs.core.rand_int(i);
      a[i] = a[j];
      a[j] = i;
      var G__25633 = i + 1;
      i = G__25633;
      continue
    }
    break
  }
};
cljs.core.async.alt_flag = function alt_flag() {
  var flag = cljs.core.atom.cljs$core$IFn$_invoke$arity$1(true);
  if(void 0 === cljs.core.async.t25637) {
    goog.provide("cljs.core.async.t25637");
    cljs.core.async.t25637 = function(flag, alt_flag, meta25638) {
      this.flag = flag;
      this.alt_flag = alt_flag;
      this.meta25638 = meta25638;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.t25637.cljs$lang$type = true;
    cljs.core.async.t25637.cljs$lang$ctorStr = "cljs.core.async/t25637";
    cljs.core.async.t25637.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
      return cljs.core._write(writer__2842__auto__, "cljs.core.async/t25637")
    };
    cljs.core.async.t25637.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.t25637.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return cljs.core.deref(self__.flag)
    };
    cljs.core.async.t25637.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      cljs.core.reset_BANG_(self__.flag, null);
      return true
    };
    cljs.core.async.t25637.prototype.cljs$core$IMeta$_meta$arity$1 = function(_25639) {
      var self__ = this;
      return self__.meta25638
    };
    cljs.core.async.t25637.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_25639, meta25638__$1) {
      var self__ = this;
      return new cljs.core.async.t25637(self__.flag, self__.alt_flag, meta25638__$1)
    };
    cljs.core.async.__GT_t25637 = function __GT_t25637(flag__$1, alt_flag__$1, meta25638) {
      return new cljs.core.async.t25637(flag__$1, alt_flag__$1, meta25638)
    }
  }else {
  }
  return new cljs.core.async.t25637(flag, alt_flag, null)
};
cljs.core.async.alt_handler = function alt_handler(flag, cb) {
  if(void 0 === cljs.core.async.t25643) {
    goog.provide("cljs.core.async.t25643");
    cljs.core.async.t25643 = function(cb, flag, alt_handler, meta25644) {
      this.cb = cb;
      this.flag = flag;
      this.alt_handler = alt_handler;
      this.meta25644 = meta25644;
      this.cljs$lang$protocol_mask$partition1$ = 0;
      this.cljs$lang$protocol_mask$partition0$ = 393216
    };
    cljs.core.async.t25643.cljs$lang$type = true;
    cljs.core.async.t25643.cljs$lang$ctorStr = "cljs.core.async/t25643";
    cljs.core.async.t25643.cljs$lang$ctorPrWriter = function(this__2841__auto__, writer__2842__auto__, opt__2843__auto__) {
      return cljs.core._write(writer__2842__auto__, "cljs.core.async/t25643")
    };
    cljs.core.async.t25643.prototype.cljs$core$async$impl$protocols$Handler$ = true;
    cljs.core.async.t25643.prototype.cljs$core$async$impl$protocols$Handler$active_QMARK_$arity$1 = function(_) {
      var self__ = this;
      return cljs.core.async.impl.protocols.active_QMARK_(self__.flag)
    };
    cljs.core.async.t25643.prototype.cljs$core$async$impl$protocols$Handler$commit$arity$1 = function(_) {
      var self__ = this;
      cljs.core.async.impl.protocols.commit(self__.flag);
      return self__.cb
    };
    cljs.core.async.t25643.prototype.cljs$core$IMeta$_meta$arity$1 = function(_25645) {
      var self__ = this;
      return self__.meta25644
    };
    cljs.core.async.t25643.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_25645, meta25644__$1) {
      var self__ = this;
      return new cljs.core.async.t25643(self__.cb, self__.flag, self__.alt_handler, meta25644__$1)
    };
    cljs.core.async.__GT_t25643 = function __GT_t25643(cb__$1, flag__$1, alt_handler__$1, meta25644) {
      return new cljs.core.async.t25643(cb__$1, flag__$1, alt_handler__$1, meta25644)
    }
  }else {
  }
  return new cljs.core.async.t25643(cb, flag, alt_handler, null)
};
cljs.core.async.do_alts = function do_alts(fret, ports, opts) {
  var flag = cljs.core.async.alt_flag();
  var n = cljs.core.count(ports);
  var idxs = cljs.core.async.random_array(n);
  var priority = (new cljs.core.Keyword("\ufdd0:priority")).call(null, opts);
  var ret = function() {
    var i = 0;
    while(true) {
      if(i < n) {
        var idx = cljs.core.truth_(priority) ? i : idxs[i];
        var port = cljs.core.nth.cljs$core$IFn$_invoke$arity$2(ports, idx);
        var wport = cljs.core.vector_QMARK_(port) ? port.cljs$core$IFn$_invoke$arity$1 ? port.cljs$core$IFn$_invoke$arity$1(0) : port.call(null, 0) : null;
        var vbox = cljs.core.truth_(wport) ? function() {
          var val = port.cljs$core$IFn$_invoke$arity$1 ? port.cljs$core$IFn$_invoke$arity$1(1) : port.call(null, 1);
          return cljs.core.async.impl.protocols.put_BANG_(wport, val, cljs.core.async.alt_handler(flag, function(i, val, idx, port, wport, flag, n, idxs, priority) {
            return function() {
              return fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.fromArray([null, wport], true)) : fret.call(null, cljs.core.PersistentVector.fromArray([null, wport], true))
            }
          }(i, val, idx, port, wport, flag, n, idxs, priority)))
        }() : cljs.core.async.impl.protocols.take_BANG_(port, cljs.core.async.alt_handler(flag, function(i, idx, port, wport, flag, n, idxs, priority) {
          return function(p1__25646_SHARP_) {
            return fret.cljs$core$IFn$_invoke$arity$1 ? fret.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentVector.fromArray([p1__25646_SHARP_, port], true)) : fret.call(null, cljs.core.PersistentVector.fromArray([p1__25646_SHARP_, port], true))
          }
        }(i, idx, port, wport, flag, n, idxs, priority)));
        if(cljs.core.truth_(vbox)) {
          return cljs.core.async.impl.channels.box(cljs.core.PersistentVector.fromArray([cljs.core.deref(vbox), function() {
            var or__3943__auto__ = wport;
            if(cljs.core.truth_(or__3943__auto__)) {
              return or__3943__auto__
            }else {
              return port
            }
          }()], true))
        }else {
          var G__25647 = i + 1;
          i = G__25647;
          continue
        }
      }else {
        return null
      }
      break
    }
  }();
  var or__3943__auto__ = ret;
  if(cljs.core.truth_(or__3943__auto__)) {
    return or__3943__auto__
  }else {
    if(cljs.core.contains_QMARK_(opts, "\ufdd0:default")) {
      var temp__4092__auto__ = function() {
        var and__3941__auto__ = cljs.core.async.impl.protocols.active_QMARK_(flag);
        if(cljs.core.truth_(and__3941__auto__)) {
          return cljs.core.async.impl.protocols.commit(flag)
        }else {
          return and__3941__auto__
        }
      }();
      if(cljs.core.truth_(temp__4092__auto__)) {
        var got = temp__4092__auto__;
        return cljs.core.async.impl.channels.box(cljs.core.PersistentVector.fromArray([(new cljs.core.Keyword("\ufdd0:default")).call(null, opts), "\ufdd0:default"], true))
      }else {
        return null
      }
    }else {
      return null
    }
  }
};
goog.provide("async_tests.paint.core");
goog.require("cljs.core");
goog.require("async_tests.paint.utils");
goog.require("cljs.core.async");
goog.require("cljs.core.async");
goog.require("async_tests.paint.utils");
async_tests.paint.core.canvas = async_tests.paint.utils.by_id.call(null, "paint-canvas");
async_tests.paint.core.line_button = async_tests.paint.utils.by_id.call(null, "line");
async_tests.paint.core.circle_button = async_tests.paint.utils.by_id.call(null, "circle");
async_tests.paint.core.stroke_color = async_tests.paint.utils.by_id.call(null, "stroke-color");
async_tests.paint.core.stroke_width = async_tests.paint.utils.by_id.call(null, "stroke-width");
async_tests.paint.core.ctx = async_tests.paint.core.canvas.getContext("2d");
async_tests.paint.core.stroke_color_channel = function() {
  var channel = cljs.core.async.chan.call(null);
  async_tests.paint.core.stroke_color.addEventListener("input", function(p1__62207_SHARP_) {
    return cljs.core.async.put_BANG_.call(null, channel, p1__62207_SHARP_.target.value)
  });
  return channel
}();
async_tests.paint.core.stroke_width_channel = function() {
  var channel = cljs.core.async.chan.call(null);
  async_tests.paint.core.stroke_width.addEventListener("input", function(p1__62208_SHARP_) {
    return cljs.core.async.put_BANG_.call(null, channel, parseInt(p1__62208_SHARP_.target.value))
  });
  return channel
}();
async_tests.paint.core.canvas_click_channel = function() {
  var channel = cljs.core.async.chan.call(null);
  async_tests.paint.core.canvas.addEventListener("mousedown", function(p1__62209_SHARP_) {
    return cljs.core.async.put_BANG_.call(null, channel, cljs.core.PersistentVector.fromArray([p1__62209_SHARP_.pageX - async_tests.paint.core.canvas.offsetLeft, p1__62209_SHARP_.pageY - async_tests.paint.core.canvas.offsetTop], true))
  });
  return channel
}();
async_tests.paint.core.button_channel = cljs.core.async.chan.call(null);
async_tests.paint.core.set_button_channels_BANG_ = function() {
  var set_button_channels_BANG___delegate = function(buttons) {
    var seq__62214 = cljs.core.seq.call(null, buttons);
    var chunk__62215 = null;
    var count__62216 = 0;
    var i__62217 = 0;
    while(true) {
      if(i__62217 < count__62216) {
        var button = cljs.core._nth.call(null, chunk__62215, i__62217);
        var id_62218 = cljs.core.keyword.call(null, button.getAttribute("id"));
        button.addEventListener("click", function(seq__62214, chunk__62215, count__62216, i__62217, id_62218, button) {
          return function() {
            return cljs.core.async.put_BANG_.call(null, async_tests.paint.core.button_channel, id_62218)
          }
        }(seq__62214, chunk__62215, count__62216, i__62217, id_62218, button));
        var G__62219 = seq__62214;
        var G__62220 = chunk__62215;
        var G__62221 = count__62216;
        var G__62222 = i__62217 + 1;
        seq__62214 = G__62219;
        chunk__62215 = G__62220;
        count__62216 = G__62221;
        i__62217 = G__62222;
        continue
      }else {
        var temp__4092__auto__ = cljs.core.seq.call(null, seq__62214);
        if(temp__4092__auto__) {
          var seq__62214__$1 = temp__4092__auto__;
          if(cljs.core.chunked_seq_QMARK_.call(null, seq__62214__$1)) {
            var c__3031__auto__ = cljs.core.chunk_first.call(null, seq__62214__$1);
            var G__62223 = cljs.core.chunk_rest.call(null, seq__62214__$1);
            var G__62224 = c__3031__auto__;
            var G__62225 = cljs.core.count.call(null, c__3031__auto__);
            var G__62226 = 0;
            seq__62214 = G__62223;
            chunk__62215 = G__62224;
            count__62216 = G__62225;
            i__62217 = G__62226;
            continue
          }else {
            var button = cljs.core.first.call(null, seq__62214__$1);
            var id_62227 = cljs.core.keyword.call(null, button.getAttribute("id"));
            button.addEventListener("click", function(seq__62214, chunk__62215, count__62216, i__62217, id_62227, button, seq__62214__$1, temp__4092__auto__) {
              return function() {
                return cljs.core.async.put_BANG_.call(null, async_tests.paint.core.button_channel, id_62227)
              }
            }(seq__62214, chunk__62215, count__62216, i__62217, id_62227, button, seq__62214__$1, temp__4092__auto__));
            var G__62228 = cljs.core.next.call(null, seq__62214__$1);
            var G__62229 = null;
            var G__62230 = 0;
            var G__62231 = 0;
            seq__62214 = G__62228;
            chunk__62215 = G__62229;
            count__62216 = G__62230;
            i__62217 = G__62231;
            continue
          }
        }else {
          return null
        }
      }
      break
    }
  };
  var set_button_channels_BANG_ = function(var_args) {
    var buttons = null;
    if(arguments.length > 0) {
      buttons = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return set_button_channels_BANG___delegate.call(this, buttons)
  };
  set_button_channels_BANG_.cljs$lang$maxFixedArity = 0;
  set_button_channels_BANG_.cljs$lang$applyTo = function(arglist__62232) {
    var buttons = cljs.core.seq(arglist__62232);
    return set_button_channels_BANG___delegate(buttons)
  };
  set_button_channels_BANG_.cljs$core$IFn$_invoke$arity$variadic = set_button_channels_BANG___delegate;
  return set_button_channels_BANG_
}();
async_tests.paint.core.set_button_channels_BANG_.call(null, async_tests.paint.core.line_button, async_tests.paint.core.circle_button);
async_tests.paint.core.draw_line = function draw_line(p__62233, p__62234) {
  var vec__62237 = p__62233;
  var px = cljs.core.nth.call(null, vec__62237, 0, null);
  var py = cljs.core.nth.call(null, vec__62237, 1, null);
  var vec__62238 = p__62234;
  var qx = cljs.core.nth.call(null, vec__62238, 0, null);
  var qy = cljs.core.nth.call(null, vec__62238, 1, null);
  async_tests.paint.core.ctx.beginPath();
  async_tests.paint.core.ctx.moveTo(px, py);
  async_tests.paint.core.ctx.lineTo(qx, qy);
  async_tests.paint.core.ctx.stroke();
  return async_tests.paint.core.ctx.closePath()
};
async_tests.paint.core.draw_circle = function draw_circle(p__62239, r) {
  var vec__62241 = p__62239;
  var cx = cljs.core.nth.call(null, vec__62241, 0, null);
  var cy = cljs.core.nth.call(null, vec__62241, 1, null);
  async_tests.paint.core.ctx.beginPath();
  async_tests.paint.core.ctx.arc(cx, cy, r, 0, 2 * async_tests.paint.utils.PI, true);
  async_tests.paint.core.ctx.stroke();
  return async_tests.paint.core.ctx.closePath()
};
async_tests.paint.core.action = function() {
  var method_table__3088__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var prefer_table__3089__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var method_cache__3090__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var cached_hierarchy__3091__auto__ = cljs.core.atom.call(null, cljs.core.PersistentArrayMap.EMPTY);
  var hierarchy__3092__auto__ = cljs.core.get.call(null, cljs.core.PersistentArrayMap.EMPTY, "\ufdd0:hierarchy", cljs.core.get_global_hierarchy.call(null));
  return new cljs.core.MultiFn("action", cljs.core.identity, "\ufdd0:default", hierarchy__3092__auto__, method_table__3088__auto__, prefer_table__3089__auto__, method_cache__3090__auto__, cached_hierarchy__3091__auto__)
}();
cljs.core._add_method.call(null, async_tests.paint.core.action, "\ufdd0:line", function(_) {
  var c__6309__auto__ = cljs.core.async.chan.call(null, 1);
  cljs.core.async.impl.dispatch.run.call(null, function() {
    var f__6310__auto__ = function() {
      var state_machine__5255__auto__ = null;
      var state_machine__5255__auto____0 = function() {
        var statearr_62252 = new Array(6);
        statearr_62252[0] = state_machine__5255__auto__;
        statearr_62252[1] = 1;
        return statearr_62252
      };
      var state_machine__5255__auto____1 = function(state_62248) {
        while(true) {
          var result__5256__auto__ = function() {
            var G__62253 = state_62248[1] | 0;
            if(cljs.core._EQ_.call(null, 1, G__62253)) {
              var state_62248__$1 = state_62248;
              return cljs.core.async.impl.ioc_helpers.take_BANG_.call(null, state_62248__$1, 2, async_tests.paint.core.canvas_click_channel)
            }else {
              if(cljs.core._EQ_.call(null, 2, G__62253)) {
                var inst_62243 = state_62248[2];
                var state_62248__$1 = function() {
                  var statearr_62254 = state_62248;
                  statearr_62254[5] = inst_62243;
                  return statearr_62254
                }();
                return cljs.core.async.impl.ioc_helpers.take_BANG_.call(null, state_62248__$1, 3, async_tests.paint.core.canvas_click_channel)
              }else {
                if(cljs.core._EQ_.call(null, 3, G__62253)) {
                  var inst_62243 = state_62248[5];
                  var inst_62245 = state_62248[2];
                  var inst_62246 = async_tests.paint.core.draw_line.call(null, inst_62243, inst_62245);
                  var state_62248__$1 = state_62248;
                  return cljs.core.async.impl.ioc_helpers.return_chan.call(null, state_62248__$1, inst_62246)
                }else {
                  if("\ufdd0:else") {
                    throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(state_62248[1] | 0)].join(""));
                  }else {
                    return null
                  }
                }
              }
            }
          }();
          if(result__5256__auto__ === "\ufdd0:recur") {
            continue
          }else {
            return result__5256__auto__
          }
          break
        }
      };
      state_machine__5255__auto__ = function(state_62248) {
        switch(arguments.length) {
          case 0:
            return state_machine__5255__auto____0.call(this);
          case 1:
            return state_machine__5255__auto____1.call(this, state_62248)
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      state_machine__5255__auto__.cljs$core$IFn$_invoke$arity$0 = state_machine__5255__auto____0;
      state_machine__5255__auto__.cljs$core$IFn$_invoke$arity$1 = state_machine__5255__auto____1;
      return state_machine__5255__auto__
    }();
    var state__6311__auto__ = function() {
      var statearr_62255 = f__6310__auto__.call(null);
      statearr_62255[cljs.core.async.impl.ioc_helpers.USER_START_IDX] = c__6309__auto__;
      return statearr_62255
    }();
    return cljs.core.async.impl.ioc_helpers.run_state_machine.call(null, state__6311__auto__)
  });
  return c__6309__auto__
});
cljs.core._add_method.call(null, async_tests.paint.core.action, "\ufdd0:circle", function(_) {
  var c__6309__auto__ = cljs.core.async.chan.call(null, 1);
  cljs.core.async.impl.dispatch.run.call(null, function() {
    var f__6310__auto__ = function() {
      var state_machine__5255__auto__ = null;
      var state_machine__5255__auto____0 = function() {
        var statearr_62267 = new Array(6);
        statearr_62267[0] = state_machine__5255__auto__;
        statearr_62267[1] = 1;
        return statearr_62267
      };
      var state_machine__5255__auto____1 = function(state_62263) {
        while(true) {
          var result__5256__auto__ = function() {
            var G__62268 = state_62263[1] | 0;
            if(cljs.core._EQ_.call(null, 1, G__62268)) {
              var state_62263__$1 = state_62263;
              return cljs.core.async.impl.ioc_helpers.take_BANG_.call(null, state_62263__$1, 2, async_tests.paint.core.canvas_click_channel)
            }else {
              if(cljs.core._EQ_.call(null, 2, G__62268)) {
                var inst_62257 = state_62263[2];
                var state_62263__$1 = function() {
                  var statearr_62269 = state_62263;
                  statearr_62269[5] = inst_62257;
                  return statearr_62269
                }();
                return cljs.core.async.impl.ioc_helpers.take_BANG_.call(null, state_62263__$1, 3, async_tests.paint.core.canvas_click_channel)
              }else {
                if(cljs.core._EQ_.call(null, 3, G__62268)) {
                  var inst_62257 = state_62263[5];
                  var inst_62259 = state_62263[2];
                  var inst_62260 = async_tests.paint.utils.len.call(null, inst_62257, inst_62259);
                  var inst_62261 = async_tests.paint.core.draw_circle.call(null, inst_62257, inst_62260);
                  var state_62263__$1 = state_62263;
                  return cljs.core.async.impl.ioc_helpers.return_chan.call(null, state_62263__$1, inst_62261)
                }else {
                  if("\ufdd0:else") {
                    throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(state_62263[1] | 0)].join(""));
                  }else {
                    return null
                  }
                }
              }
            }
          }();
          if(result__5256__auto__ === "\ufdd0:recur") {
            continue
          }else {
            return result__5256__auto__
          }
          break
        }
      };
      state_machine__5255__auto__ = function(state_62263) {
        switch(arguments.length) {
          case 0:
            return state_machine__5255__auto____0.call(this);
          case 1:
            return state_machine__5255__auto____1.call(this, state_62263)
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      state_machine__5255__auto__.cljs$core$IFn$_invoke$arity$0 = state_machine__5255__auto____0;
      state_machine__5255__auto__.cljs$core$IFn$_invoke$arity$1 = state_machine__5255__auto____1;
      return state_machine__5255__auto__
    }();
    var state__6311__auto__ = function() {
      var statearr_62270 = f__6310__auto__.call(null);
      statearr_62270[cljs.core.async.impl.ioc_helpers.USER_START_IDX] = c__6309__auto__;
      return statearr_62270
    }();
    return cljs.core.async.impl.ioc_helpers.run_state_machine.call(null, state__6311__auto__)
  });
  return c__6309__auto__
});
async_tests.paint.core.init = function init() {
  var c__6309__auto__ = cljs.core.async.chan.call(null, 1);
  cljs.core.async.impl.dispatch.run.call(null, function() {
    var f__6310__auto__ = function() {
      var state_machine__5255__auto__ = null;
      var state_machine__5255__auto____0 = function() {
        var statearr_62448 = new Array(9);
        statearr_62448[0] = state_machine__5255__auto__;
        statearr_62448[1] = 1;
        return statearr_62448
      };
      var state_machine__5255__auto____1 = function(state_62421) {
        while(true) {
          var result__5256__auto__ = function() {
            var G__62449 = state_62421[1] | 0;
            if(cljs.core._EQ_.call(null, 1, G__62449)) {
              var state_62421__$1 = state_62421;
              var statearr_62450_62475 = state_62421__$1;
              statearr_62450_62475[2] = null;
              statearr_62450_62475[1] = 2;
              return"\ufdd0:recur"
            }else {
              if(cljs.core._EQ_.call(null, 2, G__62449)) {
                var state_62421__$1 = state_62421;
                if(true) {
                  var statearr_62451_62476 = state_62421__$1;
                  statearr_62451_62476[1] = 4
                }else {
                  var statearr_62452_62477 = state_62421__$1;
                  statearr_62452_62477[1] = 5
                }
                return"\ufdd0:recur"
              }else {
                if(cljs.core._EQ_.call(null, 3, G__62449)) {
                  var inst_62419 = state_62421[2];
                  var state_62421__$1 = state_62421;
                  return cljs.core.async.impl.ioc_helpers.return_chan.call(null, state_62421__$1, inst_62419)
                }else {
                  if(cljs.core._EQ_.call(null, 4, G__62449)) {
                    var inst_62381 = cljs.core.vector.call(null, async_tests.paint.core.button_channel, async_tests.paint.core.stroke_color_channel, async_tests.paint.core.stroke_width_channel);
                    var state_62421__$1 = state_62421;
                    return cljs.core.async.impl.ioc_helpers.ioc_alts_BANG_.call(null, state_62421__$1, 7, inst_62381)
                  }else {
                    if(cljs.core._EQ_.call(null, 5, G__62449)) {
                      var state_62421__$1 = state_62421;
                      var statearr_62453_62478 = state_62421__$1;
                      statearr_62453_62478[2] = null;
                      statearr_62453_62478[1] = 6;
                      return"\ufdd0:recur"
                    }else {
                      if(cljs.core._EQ_.call(null, 6, G__62449)) {
                        var inst_62417 = state_62421[2];
                        var state_62421__$1 = state_62421;
                        var statearr_62454_62479 = state_62421__$1;
                        statearr_62454_62479[2] = inst_62417;
                        statearr_62454_62479[1] = 3;
                        return"\ufdd0:recur"
                      }else {
                        if(cljs.core._EQ_.call(null, 7, G__62449)) {
                          var inst_62385 = state_62421[5];
                          var inst_62383 = state_62421[6];
                          var inst_62383__$1 = state_62421[2];
                          var inst_62384 = cljs.core.nth.call(null, inst_62383__$1, 0, null);
                          var inst_62385__$1 = cljs.core.nth.call(null, inst_62383__$1, 1, null);
                          var inst_62386 = cljs.core._EQ_.call(null, inst_62385__$1, async_tests.paint.core.button_channel);
                          var state_62421__$1 = function() {
                            var statearr_62455 = state_62421;
                            statearr_62455[5] = inst_62385__$1;
                            statearr_62455[7] = inst_62384;
                            statearr_62455[6] = inst_62383__$1;
                            return statearr_62455
                          }();
                          if(inst_62386) {
                            var statearr_62456_62480 = state_62421__$1;
                            statearr_62456_62480[1] = 8
                          }else {
                            var statearr_62457_62481 = state_62421__$1;
                            statearr_62457_62481[1] = 9
                          }
                          return"\ufdd0:recur"
                        }else {
                          if(cljs.core._EQ_.call(null, 8, G__62449)) {
                            var inst_62383 = state_62421[6];
                            var inst_62389 = cljs.core.nth.call(null, inst_62383, 0, null);
                            var inst_62390 = async_tests.paint.core.action.call(null, inst_62389);
                            var state_62421__$1 = state_62421;
                            var statearr_62458_62482 = state_62421__$1;
                            statearr_62458_62482[2] = inst_62390;
                            statearr_62458_62482[1] = 10;
                            return"\ufdd0:recur"
                          }else {
                            if(cljs.core._EQ_.call(null, 9, G__62449)) {
                              var inst_62385 = state_62421[5];
                              var inst_62392 = cljs.core._EQ_.call(null, inst_62385, async_tests.paint.core.stroke_color_channel);
                              var state_62421__$1 = state_62421;
                              if(inst_62392) {
                                var statearr_62459_62483 = state_62421__$1;
                                statearr_62459_62483[1] = 11
                              }else {
                                var statearr_62460_62484 = state_62421__$1;
                                statearr_62460_62484[1] = 12
                              }
                              return"\ufdd0:recur"
                            }else {
                              if(cljs.core._EQ_.call(null, 10, G__62449)) {
                                var inst_62414 = state_62421[2];
                                var state_62421__$1 = function() {
                                  var statearr_62461 = state_62421;
                                  statearr_62461[8] = inst_62414;
                                  return statearr_62461
                                }();
                                var statearr_62462_62485 = state_62421__$1;
                                statearr_62462_62485[2] = null;
                                statearr_62462_62485[1] = 2;
                                return"\ufdd0:recur"
                              }else {
                                if(cljs.core._EQ_.call(null, 11, G__62449)) {
                                  var inst_62383 = state_62421[6];
                                  var inst_62395 = cljs.core.nth.call(null, inst_62383, 0, null);
                                  var inst_62396 = async_tests.paint.core.ctx["strokeStyle"] = inst_62395;
                                  var state_62421__$1 = state_62421;
                                  var statearr_62463_62486 = state_62421__$1;
                                  statearr_62463_62486[2] = inst_62396;
                                  statearr_62463_62486[1] = 13;
                                  return"\ufdd0:recur"
                                }else {
                                  if(cljs.core._EQ_.call(null, 12, G__62449)) {
                                    var inst_62385 = state_62421[5];
                                    var inst_62398 = cljs.core._EQ_.call(null, inst_62385, async_tests.paint.core.stroke_width_channel);
                                    var state_62421__$1 = state_62421;
                                    if(inst_62398) {
                                      var statearr_62464_62487 = state_62421__$1;
                                      statearr_62464_62487[1] = 14
                                    }else {
                                      var statearr_62465_62488 = state_62421__$1;
                                      statearr_62465_62488[1] = 15
                                    }
                                    return"\ufdd0:recur"
                                  }else {
                                    if(cljs.core._EQ_.call(null, 13, G__62449)) {
                                      var inst_62412 = state_62421[2];
                                      var state_62421__$1 = state_62421;
                                      var statearr_62466_62489 = state_62421__$1;
                                      statearr_62466_62489[2] = inst_62412;
                                      statearr_62466_62489[1] = 10;
                                      return"\ufdd0:recur"
                                    }else {
                                      if(cljs.core._EQ_.call(null, 14, G__62449)) {
                                        var inst_62383 = state_62421[6];
                                        var inst_62401 = cljs.core.nth.call(null, inst_62383, 0, null);
                                        var inst_62402 = async_tests.paint.core.ctx["lineWidth"] = inst_62401;
                                        var state_62421__$1 = state_62421;
                                        var statearr_62467_62490 = state_62421__$1;
                                        statearr_62467_62490[2] = inst_62402;
                                        statearr_62467_62490[1] = 16;
                                        return"\ufdd0:recur"
                                      }else {
                                        if(cljs.core._EQ_.call(null, 15, G__62449)) {
                                          var inst_62385 = state_62421[5];
                                          var inst_62404 = cljs.core._EQ_.call(null, inst_62385, "\ufdd0:default");
                                          var state_62421__$1 = state_62421;
                                          if(inst_62404) {
                                            var statearr_62468_62491 = state_62421__$1;
                                            statearr_62468_62491[1] = 17
                                          }else {
                                            var statearr_62469_62492 = state_62421__$1;
                                            statearr_62469_62492[1] = 18
                                          }
                                          return"\ufdd0:recur"
                                        }else {
                                          if(cljs.core._EQ_.call(null, 16, G__62449)) {
                                            var inst_62410 = state_62421[2];
                                            var state_62421__$1 = state_62421;
                                            var statearr_62470_62493 = state_62421__$1;
                                            statearr_62470_62493[2] = inst_62410;
                                            statearr_62470_62493[1] = 13;
                                            return"\ufdd0:recur"
                                          }else {
                                            if(cljs.core._EQ_.call(null, 17, G__62449)) {
                                              var inst_62384 = state_62421[7];
                                              var state_62421__$1 = state_62421;
                                              var statearr_62471_62494 = state_62421__$1;
                                              statearr_62471_62494[2] = inst_62384;
                                              statearr_62471_62494[1] = 19;
                                              return"\ufdd0:recur"
                                            }else {
                                              if(cljs.core._EQ_.call(null, 18, G__62449)) {
                                                var state_62421__$1 = state_62421;
                                                var statearr_62472_62495 = state_62421__$1;
                                                statearr_62472_62495[2] = null;
                                                statearr_62472_62495[1] = 19;
                                                return"\ufdd0:recur"
                                              }else {
                                                if(cljs.core._EQ_.call(null, 19, G__62449)) {
                                                  var inst_62408 = state_62421[2];
                                                  var state_62421__$1 = state_62421;
                                                  var statearr_62473_62496 = state_62421__$1;
                                                  statearr_62473_62496[2] = inst_62408;
                                                  statearr_62473_62496[1] = 16;
                                                  return"\ufdd0:recur"
                                                }else {
                                                  if("\ufdd0:else") {
                                                    throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(state_62421[1] | 0)].join(""));
                                                  }else {
                                                    return null
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }();
          if(result__5256__auto__ === "\ufdd0:recur") {
            continue
          }else {
            return result__5256__auto__
          }
          break
        }
      };
      state_machine__5255__auto__ = function(state_62421) {
        switch(arguments.length) {
          case 0:
            return state_machine__5255__auto____0.call(this);
          case 1:
            return state_machine__5255__auto____1.call(this, state_62421)
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      state_machine__5255__auto__.cljs$core$IFn$_invoke$arity$0 = state_machine__5255__auto____0;
      state_machine__5255__auto__.cljs$core$IFn$_invoke$arity$1 = state_machine__5255__auto____1;
      return state_machine__5255__auto__
    }();
    var state__6311__auto__ = function() {
      var statearr_62474 = f__6310__auto__.call(null);
      statearr_62474[cljs.core.async.impl.ioc_helpers.USER_START_IDX] = c__6309__auto__;
      return statearr_62474
    }();
    return cljs.core.async.impl.ioc_helpers.run_state_machine.call(null, state__6311__auto__)
  });
  return c__6309__auto__
};
