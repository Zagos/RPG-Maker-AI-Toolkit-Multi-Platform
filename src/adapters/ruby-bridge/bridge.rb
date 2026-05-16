#!/usr/bin/env ruby
# encoding: utf-8
# RPG Maker Marshal <-> JSON bridge
# Supports: RPG Maker XP (.rxdata), VX (.rvdata), VX Ace (.rvdata2)
#
# Usage:
#   ruby bridge.rb read  <file>  -> serializes Marshal data to JSON on stdout
#   ruby bridge.rb write <file>  -> reads JSON from stdin, writes Marshal file

require 'json'

# ── Stub classes required for Marshal.load ────────────────────────────────────
# Marshal.load needs every class referenced in the file to exist.
# These stubs accept any instance variables without explicit attr definitions.

class RPGStub
  def initialize(*_args); end
end

module RPG
  STUB_NAMES = %i[
    Actor Class Skill Item Weapon Armor Enemy State
    Animation AnimationFrame AnimationTiming
    Tileset CommonEvent
    Troop TroopMember TroopPage TroopPageCondition
    Map MapInfo Event EventPage EventPageCondition EventPageGraphic
    EventCommand MoveRoute MoveCommand
    System AudioFile
    BaseItem UsableItem EquipItem
    Feature Effect DropItem EnemyAction
    BattleEventPage BattleEventPageCondition
    ClassLearning
  ].freeze

  STUB_NAMES.each do |name|
    const_set(name, ::Class.new(RPGStub)) unless const_defined?(name)
  end

  # Nested classes
  class System
    [:Words, :TestBattler, :Vehicle].each do |name|
      const_set(name, ::Class.new(RPGStub)) unless const_defined?(name)
    end
  end

  class Enemy
    const_set(:DropItem, ::Class.new(RPGStub)) unless const_defined?(:DropItem)
    const_set(:Action, ::Class.new(RPGStub))   unless const_defined?(:Action)
  end
end

# ── Special serializable types ────────────────────────────────────────────────

class Table
  def marshal_load(arr)
    @xsize = arr[1]
    @ysize = arr[2]
    @zsize = arr[3]
    @data  = arr[5..] || []
  end

  def marshal_dump
    dims  = @zsize > 1 ? 3 : (@ysize > 1 ? 2 : 1)
    total = (@xsize || 1) * (@ysize || 1) * (@zsize || 1)
    [dims, @xsize || 1, @ysize || 1, @zsize || 1, total, *(@data || [])]
  end

  def to_json_obj
    { '__class' => 'Table',
      'xsize'   => @xsize, 'ysize' => @ysize, 'zsize' => @zsize,
      'data'    => @data }
  end
end

class Color
  def marshal_load(arr)
    @red, @green, @blue, @alpha = arr
  end
  def marshal_dump; [@red.to_f, @green.to_f, @blue.to_f, @alpha.to_f]; end
  def to_json_obj
    { '__class' => 'Color',
      'red' => @red, 'green' => @green, 'blue' => @blue, 'alpha' => @alpha }
  end
end

class Tone
  def marshal_load(arr)
    @red, @green, @blue, @gray = arr
  end
  def marshal_dump; [@red.to_f, @green.to_f, @blue.to_f, @gray.to_f]; end
  def to_json_obj
    { '__class' => 'Tone',
      'red' => @red, 'green' => @green, 'blue' => @blue, 'gray' => @gray }
  end
end

# ── Ruby object → JSON-serializable value ────────────────────────────────────

def obj_to_json(obj)
  case obj
  when NilClass, TrueClass, FalseClass, Integer, Float
    obj
  when String
    begin
      obj.encode('UTF-8', invalid: :replace, undef: :replace)
    rescue StandardError
      obj.dup.force_encoding('UTF-8')
    end
  when Symbol
    obj.to_s
  when Array
    obj.map { |e| obj_to_json(e) }
  when Hash
    obj.each_with_object({}) { |(k, v), h| h[obj_to_json(k).to_s] = obj_to_json(v) }
  when Table, Color, Tone
    obj.to_json_obj
  else
    result = { '__class' => obj.class.name }
    obj.instance_variables.each do |var|
      result[var.to_s[1..]] = obj_to_json(obj.instance_variable_get(var))
    end
    result
  end
end

# ── JSON value → Ruby object ─────────────────────────────────────────────────

def json_to_obj(data)
  case data
  when NilClass, TrueClass, FalseClass, Integer, Float, String
    data
  when Array
    data.map { |e| json_to_obj(e) }
  when Hash
    class_name = data['__class']
    return data.each_with_object({}) { |(k, v), h| h[k] = json_to_obj(v) } if class_name.nil?

    case class_name
    when 'Table'
      t = Table.allocate
      t.instance_variable_set(:@xsize, data['xsize'])
      t.instance_variable_set(:@ysize, data['ysize'])
      t.instance_variable_set(:@zsize, data['zsize'])
      t.instance_variable_set(:@data,  data['data'] || [])
      t
    when 'Color'
      c = Color.allocate
      c.marshal_load([data['red'], data['green'], data['blue'], data['alpha']])
      c
    when 'Tone'
      t = Tone.allocate
      t.marshal_load([data['red'], data['green'], data['blue'], data['gray']])
      t
    else
      klass = begin
        class_name.split('::').reduce(Object) { |mod, name| mod.const_get(name) }
      rescue NameError
        RPGStub
      end
      obj = klass.allocate
      data.each do |k, v|
        next if k == '__class'
        obj.instance_variable_set(:"@#{k}", json_to_obj(v))
      end
      obj
    end
  end
end

# ── Main ──────────────────────────────────────────────────────────────────────

mode = ARGV[0]
file = ARGV[1]

abort "Usage: bridge.rb read|write <file>" unless mode && file

case mode
when 'read'
  begin
    data = Marshal.load(File.binread(file))
    $stdout.puts JSON.generate(obj_to_json(data))
    $stdout.flush
  rescue StandardError => e
    $stderr.puts "bridge error (read #{file}): #{e.message}"
    $stderr.puts e.backtrace.first(5).join("\n")
    exit 1
  end
when 'write'
  begin
    data = json_to_obj(JSON.parse($stdin.read))
    File.binwrite(file, Marshal.dump(data))
  rescue StandardError => e
    $stderr.puts "bridge error (write #{file}): #{e.message}"
    $stderr.puts e.backtrace.first(5).join("\n")
    exit 1
  end
else
  abort "Unknown mode: #{mode}. Use 'read' or 'write'"
end
