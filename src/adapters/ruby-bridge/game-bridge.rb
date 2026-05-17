# RpgMakerMCPBridge - TCP Socket Bridge for RPG Maker VX Ace / VX / XP
#
# Install this script in the Scripts editor (before the "Main" script).
# It opens a TCP server on localhost:9002 so the MCP server can control
# the running game at runtime.
#
# Protocol: newline-delimited JSON
#   {"type":"ping"}                    -> {"ok":true,"pong":true}
#   {"type":"execute","code":"..."}    -> {"ok":true} | {"ok":false,"error":"..."}
#   {"type":"query","code":"..."}      -> {"ok":true,"result":...} | {"ok":false,"error":"..."}

require 'socket'
require 'json'

module RpgMakerMCPBridge
  PORT    = (ENV['RUBY_BRIDGE_PORT'] || '9002').to_i
  VERSION = '1.0'

  @server  = nil
  @thread  = nil
  @started = false

  def self.start
    return if @started
    @started = true
    @thread  = Thread.new { run_server }
    @thread.abort_on_exception = false
  end

  def self.stop
    @started = false
    begin; @server.close; rescue; end
    begin; @thread.kill; rescue; end
  end

  def self.run_server
    @server = TCPServer.new('127.0.0.1', PORT)
    loop do
      break unless @started
      begin
        client = @server.accept
        handle_client(client)
      rescue IOError, Errno::EBADF
        break
      rescue => _e
        # Continue accepting after recoverable errors
      end
    end
  rescue => _e
    # Failed to start (port in use, etc.) — fail silently
  ensure
    begin; @server.close; rescue; end
    @server = nil
  end

  def self.handle_client(client)
    client.sync = true
    loop do
      line = client.gets
      break if line.nil?
      line = line.chomp.strip
      next if line.empty?

      begin
        cmd  = JSON.parse(line)
        resp = dispatch(cmd)
        client.write(JSON.generate(resp) + "\n")
      rescue JSON::ParserError => e
        begin
          client.write(JSON.generate({'ok' => false, 'error' => "JSON parse error: #{e.message}"}) + "\n")
        rescue; end
      rescue => e
        begin
          client.write(JSON.generate({'ok' => false, 'error' => e.message}) + "\n")
        rescue; end
        break
      end
    end
  rescue => _e
    # Client disconnected or I/O error
  ensure
    begin; client.close; rescue; end
  end

  def self.dispatch(cmd)
    case cmd['type']
    when 'ping'
      {'ok' => true, 'pong' => true, 'version' => VERSION}
    when 'execute'
      eval(cmd['code'].to_s, TOPLEVEL_BINDING)
      {'ok' => true}
    when 'query'
      result = eval(cmd['code'].to_s, TOPLEVEL_BINDING)
      {'ok' => true, 'result' => serialize(result)}
    else
      {'ok' => false, 'error' => "Unknown command type: #{cmd['type']}"}
    end
  rescue => e
    {'ok' => false, 'error' => e.message}
  end

  # Recursively converts a Ruby value to a JSON-safe structure.
  # Objects that aren't primitives, arrays, or hashes are stringified.
  def self.serialize(val)
    case val
    when NilClass, TrueClass, FalseClass, Integer, Float
      val
    when String
      val.encode('UTF-8', invalid: :replace, undef: :replace, replace: '?')
    when Symbol
      val.to_s
    when Array
      val.map { |v| serialize(v) }
    when Hash
      val.each_with_object({}) { |(k, v), h| h[k.to_s] = serialize(v) }
    else
      begin; val.to_s; rescue; '(unserializable)'; end
    end
  end
end

# Start the bridge immediately when this script is loaded at game boot.
RpgMakerMCPBridge.start
